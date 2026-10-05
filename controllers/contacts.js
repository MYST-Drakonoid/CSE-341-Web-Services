import * as MongoDB from '../db/connect.js';
import { ObjectId } from 'mongodb';

const getAll = async (req, res, next) => {
    const result = MongoDB.getDb().collection('Contacts').find();
    result.toArray().then((lists) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getSingleContact = async (req, res, next) => {
    const userId = new ObjectId(req.params.id);
    const result = MongoDB.getDb().collection('Contacts').find({_id: userId});
    result.toArray().then((lists) => {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists[0]);
    });
};

const createContact = async (req, res, next) => {
    const contact = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        favoriteColor: req.body.favoriteColor,
        birthday: req.body.birthday
    };
    const result = await MongoDB.getDb().collection('Contacts').insertOne(contact);
    if (result.acknowledged) {
        res.status(201).json(result);
    } else {
        res.status(500).json(result.error || 'Some error occurred while creating the contact.');
    }
};

const updateContact = async (req, res, next) => {


    const userId = new ObjectId(req.params.id);
    const contact = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        favoriteColor: req.body.favoriteColor,
        birthday: req.body.birthday
    };
    const result = await MongoDB.getDb().collection('Contacts').updateOne(
        { _id: userId },
        { $set: contact }
    );
    if (result.matchedCount > 0) {
        console.log(`Contact with ID ${req.params.id} updated successfully.`);
        res.status(204).send();
    } else {
        res.status(500).json(result.error || 'Some error occurred while updating the contact.');
    }
};

const deleteContact = async (req, res, next) => {
    const userId = new ObjectId(req.params.id);
    const result = await MongoDB.getDb().collection('Contacts').deleteOne({ _id: userId });
    if (result.deletedCount > 0) {
        console.log(`Contact with ID ${req.params.id} deleted successfully.`);
        res.status(204).send();
    } else {
        res.status(500).json(result.error || 'Some error occurred while deleting the contact.');
    }
};

const getUpdateForm = async (req, res) => {
    const userId = new ObjectId(req.params.id);

    const contact = await MongoDB.getDb()
        .collection('Contacts')
        .findOne({ _id: userId });

    const updateFormHTML = `
        <form method="POST" action="/contacts/${req.params.id}?_method=PUT">
            <input
                type="text"
                name="firstName"
                value="${contact.firstName}"
                required
            >

            <input
                type="text"
                name="lastName"
                value="${contact.lastName}"
                required
            >

            <input
                type="email"
                name="email"
                value="${contact.email}"
                required
            >

            <input
                type="text"
                name="favoriteColor"
                value="${contact.favoriteColor}"
                required
            >

            <input
                type="date"
                name="birthday"
                value="${contact.birthday}"
                required
            >

            <button type="submit">Update Contact</button>
        </form>
    `;

    res.send(updateFormHTML);
};

const getNewForm = (req, res) => {
    const newFormHTML = `
        <form method="POST" action="/contacts">
            <input type="text" name="firstName" placeholder="First Name" required>
            <input type="text" name="lastName" placeholder="Last Name" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="text" name="favoriteColor" placeholder="Favorite Color" required>
            <input type="date" name="birthday" required>

            <button type="submit">Create Contact</button>
        </form>
    `;

    res.send(newFormHTML);
};

const selectDeleteContactForm = async (req, res) => {
    const contacts = await MongoDB.getDb()
        .collection('Contacts')
        .find()
        .toArray();

    const options = contacts.map(contact => `
        <option value="${contact._id}">
            ${contact.firstName} ${contact.lastName}
        </option>
    `).join('');

    const deleteFormHTML = `
        <form method="GET" action="/contacts/delete/confirm">
            <p>Please select the contact you wish to delete:</p>

            <select name="id" required>
                ${options}
            </select>

            <button type="submit">Delete Contact</button>
        </form>
    `;

    res.send(deleteFormHTML);
};

const confirmDeleteForm = (req, res) => {
    const confirmDeleteHTML = `
        <form method="POST" action="/contacts/${req.params.id}?_method=DELETE">
            <p>Are you sure you want to delete this contact?</p>
            <button type="submit">Yes, Delete</button>
        </form>
    `;

    res.send(confirmDeleteHTML);
};

export default {
    getAll,
    getSingleContact,
    createContact,
    updateContact,
    getUpdateForm,
    getNewForm,
    deleteContact,
    selectDeleteContactForm,
    confirmDeleteForm
};

