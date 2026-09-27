import express from 'express';
import contactsController from '../controllers/contacts.js';

const router = express.Router();

router.get('/', contactsController.getAll);

router.get('/:id', contactsController.getSingleContact);

export default router;