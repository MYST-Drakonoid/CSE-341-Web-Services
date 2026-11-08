
document.addEventListener('DOMContentLoaded', async () => {
    // Create the navigation bar
    const nav = document.createElement('nav');
    nav.id = 'auth-bar';

    nav.innerHTML = `
        <a class="auth-brand" href="/">
            Household Inventory
        </a>

        <div class="auth-actions">
            <a href="/api-docs/">API Docs</a>
            <a id="auth-button" href="/login">Sign In</a>
        </div>
    `;

    document.body.prepend(nav);

    
    // Simple API overview panel
    const overview = document.createElement('section');
    overview.id = 'api-overview';

    overview.innerHTML = `
        <h1>Household Inventory Tracker</h1>
        <p>
            A REST API for managing household inventory,
            tracking items, and organizing storage locations.
        </p>
        <div class="overview-details">
            <span>Node.js & Express</span>
            <span>MongoDB</span>
            <span>Auth0 Authentication</span>
        </div>
        <p class="overview-help">
            Select an endpoint below, click
            <strong>Try it out</strong>, then
            <strong>Execute</strong> to test the API.
        </p>
    `;

    nav.insertAdjacentElement('afterend', overview);


    const authButton = document.getElementById('auth-button');

    try {
        const response = await fetch('/auth/status', {
            credentials: 'same-origin',
            cache: 'no-store'
        });

        if (!response.ok) throw new Error('Authentication check failed');

        const data = await response.json();

        if (data.authenticated) {
            authButton.textContent = 'Sign Out';
            authButton.href = '/logout';
        } else {
            authButton.textContent = 'Sign In';
            authButton.href = '/login';
        }
    } catch (error) {
        console.error('Unable to check authentication:', error);
    }
});
