/* Create/update/delete editor and live collection tables for Household Inventory.
   The tables refresh every 30 seconds while the page is visible. */
(() => {
  function start() {
    if (document.getElementById('inventory-editor')) return;

    const panel = document.createElement('section');
    panel.id = 'inventory-editor';
    panel.innerHTML = `
      <div class="inventory-editor-heading">
        <div>
          <h2>Manage Inventory</h2>
          <p>Create, update, or delete inventory items and storage locations.</p>
        </div>
        <button type="button" id="inventory-editor-reload">Refresh Lists</button>
      </div>
      <form id="inventory-editor-form">
        <div class="inventory-editor-grid">
          <label>Collection
            <select id="editor-collection">
              <option value="inventory">Inventory Items</option>
              <option value="locations">Locations</option>
            </select>
          </label>
          <label>Action
            <select id="editor-mode">
              <option value="create">Create (POST)</option>
              <option value="update">Update (PUT)</option>
              <option value="delete">Delete (DELETE)</option>
            </select>
          </label>
        </div>
        <label id="editor-existing-wrap" hidden>Existing item or location
          <select id="editor-existing">
            <option value="">Select an existing record...</option>
          </select>
        </label>

        <div id="editor-fields">
        <div class="inventory-editor-grid">
          <label>Name <input id="editor-name" type="text" maxlength="200" required></label>
          <label id="editor-type-wrap">Type <input id="editor-type" type="text" maxlength="200"></label>
          <label id="editor-quantity-wrap">Quantity <input id="editor-quantity" type="number" min="0" step="1" value="1"></label>
          <label id="editor-location-wrap">Location
            <select id="editor-location"></select>
          </label>
          <label id="editor-serial-wrap">Serial number <input id="editor-serial" type="text" maxlength="200"></label>
          <label id="editor-condition-wrap">Condition <input id="editor-condition" type="text" maxlength="200"></label>
          <label id="editor-room-wrap" hidden>Room <input id="editor-room" type="text" maxlength="200"></label>
        </div>
        <label>Notes <textarea id="editor-notes" rows="2"></textarea></label>
        </div>
        <p id="editor-delete-summary" class="inventory-editor-delete-summary" hidden></p>
        <p id="editor-delete-warning" class="inventory-editor-delete-warning" hidden>
          This action cannot be undone. Locations that still contain inventory will be protected by a 409 Conflict response.
        </p>
        <div class="inventory-editor-footer">
          <button type="submit" id="inventory-editor-submit">Create Item</button>
          <span id="inventory-editor-status" role="status" aria-live="polite"></span>
        </div>
      </form>
    `;

    const anchor = document.getElementById('api-overview') || document.getElementById('auth-bar');
    if (anchor) anchor.insertAdjacentElement('afterend', panel);
    else document.body.prepend(panel);

    // Place read-only collection tables between the editor and Swagger documentation.
    const recordsPanel = document.createElement('section');
    recordsPanel.id = 'inventory-records';
    recordsPanel.setAttribute('aria-label', 'Current inventory and locations');
    recordsPanel.innerHTML = `
      <div class="inventory-records-heading">
        <div>
          <h2>Current Database Records</h2>
          <p>Live view of the <strong>items</strong> and <strong>locations</strong> MongoDB collections.</p>
        </div>
        <button type="button" id="inventory-records-refresh">Refresh Now</button>
      </div>
      <p id="inventory-records-status" class="inventory-records-status" role="status" aria-live="polite">
        Loading records…
      </p>
      <section aria-labelledby="inventory-items-title">
        <h3 id="inventory-items-title">Inventory Items <span id="inventory-items-count"></span></h3>
        <div class="inventory-records-scroll">
          <table>
            <thead><tr>
              <th scope="col">Name</th><th scope="col">Type</th>
              <th scope="col">Quantity</th><th scope="col">Serial number</th>
              <th scope="col">Location</th><th scope="col">Condition</th>
            </tr></thead>
            <tbody id="inventory-items-rows"><tr><td colspan="6">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="inventory-locations-title">
        <h3 id="inventory-locations-title">Locations <span id="inventory-locations-count"></span></h3>
        <div class="inventory-records-scroll">
          <table>
            <thead><tr>
              <th scope="col">Name</th><th scope="col">Room</th>
              <th scope="col">Assigned items</th><th scope="col">Notes</th>
            </tr></thead>
            <tbody id="inventory-locations-rows"><tr><td colspan="4">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
    `;
    panel.insertAdjacentElement('afterend', recordsPanel);

    const get = (id) => panel.querySelector(`#${id}`);
    const getRecords = (id) => recordsPanel.querySelector(`#${id}`);
    const state = { inventory: [], locations: [] };
    const collection = get('editor-collection');
    const mode = get('editor-mode');
    const existing = get('editor-existing');
    const location = get('editor-location');
    const form = get('inventory-editor-form');
    const submit = get('inventory-editor-submit');
    const deleteSummary = get('editor-delete-summary');
    const status = get('inventory-editor-status');
    let loadingPromise = null;
    let mutationInProgress = false;

    function showStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle('error', isError);
    }

    async function api(path, options = {}) {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        }
      });
      const text = await response.text();
      let body = null;
      if (text) {
        try { body = JSON.parse(text); } catch { /* Auth0 redirects can return HTML */ }
      }
      if (!response.ok) {
        const count = Number.isInteger(body?.itemsFound) ? ` (${body.itemsFound} item(s) assigned)` : '';
        throw new Error(`${body?.message || `HTTP ${response.status} (${response.statusText})`}${count}`);
      }
      if (text && body === null) {
        throw new Error('Expected JSON. Check that you are signed in.');
      }
      return body; // 204 No Content is correctly handled as null
    }

    function fillSelect(select, records, placeholder, formatLabel) {
      const old = select.value;
      select.replaceChildren(new Option(placeholder, ''));
      [...records].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .forEach(record => {
          const id = String(record._id);
          select.add(new Option(formatLabel(record), id));
        });
      if ([...select.options].some(option => option.value === old)) select.value = old;
    }

    function refreshDropdowns() {
      fillSelect(location, state.locations, 'Select a location...', x =>
        x.room ? `${x.name} (${x.room})` : x.name
      );
      const records = state[collection.value];
      fillSelect(existing, records, 'Select an existing record...', x =>
        collection.value === 'inventory' && x.serialNumber
          ? `${x.name} — ${x.serialNumber}`
          : x.name
      );
    }

    // Build table rows with textContent, never with database content in innerHTML.
    function writeRows(body, records, columns, emptyMessage) {
      body.replaceChildren();
      if (!records.length) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = columns.length;
        cell.textContent = emptyMessage;
        cell.className = 'inventory-records-empty';
        return;
      }
      [...records]
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
        .forEach(record => {
          const row = body.insertRow();
          for (const getValue of columns) {
            const value = getValue(record);
            const cell = row.insertCell();
            cell.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
          }
        });
    }

    function renderRecordTables() {
      const locationById = new Map(state.locations.map(x => [String(x._id), x]));
      const assignedCounts = new Map();
      for (const item of state.inventory) {
        const id = String(item.locationId ?? '');
        assignedCounts.set(id, (assignedCounts.get(id) || 0) + 1);
      }
      const locationName = item => {
        const linked = locationById.get(String(item.locationId ?? ''));
        return linked ? linked.name : 'Unknown location';
      };
      writeRows(getRecords('inventory-items-rows'), state.inventory, [
        x => x.name, x => x.type, x => x.quantity,
        x => x.serialNumber, locationName, x => x.condition
      ], 'No inventory items found.');
      writeRows(getRecords('inventory-locations-rows'), state.locations, [
        x => x.name, x => x.room,
        x => assignedCounts.get(String(x._id)) || 0,
        x => x.notes
      ], 'No locations found.');
      getRecords('inventory-items-count').textContent = `(${state.inventory.length})`;
      getRecords('inventory-locations-count').textContent = `(${state.locations.length})`;
    }

    // Shared fetch for dropdowns and tables. Only one refresh request can run at a time.
    function reload({ quiet = false } = {}) {
      if (loadingPromise) return loadingPromise;
      if (!quiet) showStatus('Loading records...');
      const tableStatus = getRecords('inventory-records-status');
      const refreshButton = getRecords('inventory-records-refresh');
      tableStatus.textContent = 'Refreshing records…';
      tableStatus.classList.remove('error');
      refreshButton.disabled = true;
      loadingPromise = (async () => {
        try {
          const [items, locations] = await Promise.all([
            api('/api/inventory'),
            api('/api/locations')
          ]);
          if (!Array.isArray(items) || !Array.isArray(locations)) {
            throw new Error('API did not return record lists.');
          }
          state.inventory = items;
          state.locations = locations;
          refreshDropdowns();
          renderRecordTables();
          const updated = new Date().toLocaleTimeString();
          tableStatus.textContent = `Last updated: ${updated} • Automatic refresh every 30 seconds while this tab is visible.`;
          if (!quiet) showStatus(`Loaded ${items.length} items and ${locations.length} locations.`);
          return true;
        } catch (error) {
          tableStatus.textContent = `Refresh failed: ${error.message}. Previous results are still shown, if available.`;
          tableStatus.classList.add('error');
          if (!quiet) showStatus(`Could not load records: ${error.message}`, true);
          return false;
        } finally {
          refreshButton.disabled = false;
        }
      })();
      return loadingPromise.finally(() => { loadingPromise = null; });
    }

    function clearForm() {
      form.reset();
      // form.reset also resets collection and mode; restore their current selection separately.
      get('editor-name').value = '';
      get('editor-type').value = '';
      get('editor-quantity').value = '1';
      get('editor-serial').value = '';
      get('editor-condition').value = '';
      get('editor-room').value = '';
      get('editor-notes').value = '';
      location.value = '';
    }

    function fillForm() {
      const record = state[collection.value].find(x => String(x._id) === existing.value);
      if (!record) return;
      get('editor-name').value = record.name ?? '';
      get('editor-notes').value = record.notes ?? '';
      if (collection.value === 'inventory') {
        get('editor-type').value = record.type ?? '';
        get('editor-quantity').value = record.quantity ?? 0;
        get('editor-serial').value = record.serialNumber ?? '';
        get('editor-condition').value = record.condition ?? '';
        location.value = record.locationId ? String(record.locationId) : '';
      } else {
        get('editor-room').value = record.room ?? '';
      }
      showStatus(`Editing ${record.name}.`);
    }

    function showDeleteSummary() {
      const record = state[collection.value].find(x => String(x._id) === existing.value);
      if (!record) {
        deleteSummary.textContent = 'Choose a record to delete.';
        return;
      }
      const label = collection.value === 'inventory'
        ? [record.type, record.serialNumber].filter(Boolean).join(' • ')
        : record.room || 'No room specified';
      deleteSummary.textContent = `Selected: ${record.name}${label ? ` — ${label}` : ''}`;
    }

    function showForm() {
      const isItem = collection.value === 'inventory';
      const isUpdate = mode.value === 'update';
      const isDelete = mode.value === 'delete';
      get('editor-existing-wrap').hidden = !(isUpdate || isDelete);
      existing.required = isUpdate || isDelete;
      get('editor-fields').hidden = isDelete;
      deleteSummary.hidden = !isDelete;
      get('editor-delete-warning').hidden = !isDelete;
      get('editor-name').required = !isDelete;
      ['type', 'quantity', 'location', 'serial', 'condition'].forEach(id => {
        get(`editor-${id}-wrap`).hidden = !isItem;
      });
      get('editor-room-wrap').hidden = isItem;
      get('editor-type').required = isItem && !isDelete;
      get('editor-quantity').required = isItem && !isDelete;
      location.required = isItem && !isDelete;
      submit.classList.toggle('delete-mode', isDelete);
      submit.textContent = `${isDelete ? 'Delete' : isUpdate ? 'Update' : 'Create'} ${isItem ? 'Item' : 'Location'}`;
      refreshDropdowns();
      if (isUpdate || isDelete) {
        if (existing.value) {
          if (isDelete) showDeleteSummary();
          else fillForm();
        } else {
          showDeleteSummary();
          showStatus(`Choose an existing ${isItem ? 'item' : 'location'} from the dropdown.`);
        }
      } else {
        showStatus('Enter the details for your new record.');
      }
    }

    collection.addEventListener('change', () => {
      const savedCollection = collection.value;
      const savedMode = mode.value;
      clearForm();
      collection.value = savedCollection;
      mode.value = savedMode;
      existing.value = '';
      showForm();
    });
    mode.addEventListener('change', () => {
      const savedCollection = collection.value;
      const savedMode = mode.value;
      clearForm();
      collection.value = savedCollection;
      mode.value = savedMode;
      existing.value = '';
      showForm();
    });
    existing.addEventListener('change', () => {
      if (mode.value === 'delete') {
        showDeleteSummary();
        showStatus(existing.value ? 'Review the selection, then press Delete.' : 'Choose a record to delete.');
      } else if (existing.value) {
        fillForm();
      } else {
        showStatus('Choose an existing record from the dropdown.');
      }
    });
    get('inventory-editor-reload').addEventListener('click', () => reload());
    getRecords('inventory-records-refresh').addEventListener('click', () => reload({ quiet: true }));
    // Do not refresh an inactive browser tab or interrupt a write in progress.
    window.setInterval(() => {
      if (!document.hidden && !mutationInProgress) reload({ quiet: true });
    }, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !mutationInProgress) reload({ quiet: true });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const collectionName = collection.value;
      const editing = mode.value === 'update';
      const deleting = mode.value === 'delete';
      const id = existing.value;
      if ((editing || deleting) && !id) {
        showStatus(`Select an existing record before ${deleting ? 'deleting' : 'updating'}.`, true);
        return;
      }

      const path = collectionName === 'inventory' ? '/api/inventory' : '/api/locations';
      if (deleting) {
        const record = state[collectionName].find(x => String(x._id) === id);
        if (!record) {
          showStatus('Selected record no longer exists in the loaded list. Refresh Lists.', true);
          return;
        }
        const recordType = collectionName === 'inventory' ? 'item' : 'location';
        if (!window.confirm(`Permanently delete ${recordType} "${record.name}"? This cannot be undone.`)) {
          showStatus('Deletion canceled.');
          return;
        }
        submit.disabled = true;
        mutationInProgress = true;
        showStatus('Deleting...');
        try {
          await api(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' });
          existing.value = '';
          await reload();
          showForm();
          showStatus(`${recordType === 'item' ? 'Item' : 'Location'} deleted successfully.`);
        } catch (error) {
          showStatus(`Delete failed: ${error.message}`, true);
        } finally {
          submit.disabled = false;
          mutationInProgress = false;
        }
        return;
      }

      const payload = {
        name: get('editor-name').value.trim(),
        notes: get('editor-notes').value.trim() || null
      };
      if (collectionName === 'inventory') {
        payload.type = get('editor-type').value.trim();
        payload.quantity = Number(get('editor-quantity').value);
        payload.locationId = location.value;
        payload.serialNumber = get('editor-serial').value.trim() || null;
        payload.condition = get('editor-condition').value.trim() || null;
      } else {
        payload.room = get('editor-room').value.trim() || null;
      }

      submit.disabled = true;
      mutationInProgress = true;
      showStatus(editing ? 'Updating...' : 'Creating...');
      try {
        const result = await api(editing ? `${path}/${encodeURIComponent(id)}` : path, {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        });
        const savedId = editing ? id : String(result?.id || '');
        await reload();
        if (savedId) {
          mode.value = 'update';
          showForm();
          existing.value = savedId;
          fillForm();
        }
        showStatus(`${collectionName === 'inventory' ? 'Item' : 'Location'} ${editing ? 'updated' : 'created'} successfully.`);
      } catch (error) {
        showStatus(`Save failed: ${error.message}`, true);
      } finally {
        submit.disabled = false;
        mutationInProgress = false;
      }
    });

    showForm();
    reload();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
