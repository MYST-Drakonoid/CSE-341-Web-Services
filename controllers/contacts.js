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

export default {
    getAll,
    getSingleContact
};