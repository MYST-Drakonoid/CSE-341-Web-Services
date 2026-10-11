import express from 'express';
import contactsController from '../controllers/contacts.js';

const router = express.Router();

// GET routes
router.get('/', contactsController.getAll);
router.get('/new', contactsController.getNewForm);
router.get('/delete', contactsController.selectDeleteContactForm);
router.get('/delete/confirm', contactsController.confirmDeleteForm);
router.get('/:id/edit', contactsController.getUpdateForm);
router.get('/:id', contactsController.getSingleContact);

// POST route
router.post('/', (req, res, next) => {
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ContactInput"
        }
      }
    }
  } */

  return contactsController.createContact(req, res, next);
});

// PUT routes
router.put('/:id', contactsController.updateContact);
router.put('/:id', (req, res, next) => {
  /* #swagger.parameters['id'] = {
    in: 'path',
    description: 'MongoDB contact ID',
    required: true,
    type: 'string'
  } */

  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ContactInput"
        }
      }
    }
  } */

  return contactsController.updateContact(req, res, next);
});

// PATCH route
router.patch('/update/:id', contactsController.updateContact);

// DELETE routes
router.delete('/:id', contactsController.deleteContact);
router.delete('/delete/:id', contactsController.deleteContact);

export default router;