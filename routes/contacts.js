import express from 'express';
import contactsController from '../controllers/contacts.js';

const router = express.Router();

router.get('/', contactsController.getAll);

router.get('/new', contactsController.getNewForm);

router.get('/delete', contactsController.selectDeleteContactForm);

router.get('/delete/confirm', contactsController.confirmDeleteForm);

router.get('/:id/edit', contactsController.getUpdateForm);

router.get('/:id', contactsController.getSingleContact);

router.post('/', contactsController.createContact);

router.put('/update/:id', contactsController.updateContact);

router.patch('/update/:id', contactsController.updateContact);

router.delete('/delete/:id', contactsController.deleteContact);

export default router;