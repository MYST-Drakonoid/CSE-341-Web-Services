
import * as MongoDB from '../db/connect.js';
import { ObjectId } from 'mongodb';

// Validate inventory item information
const validateItem = (item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return 'A valid item object is required.';
    }

    if (typeof item.name !== 'string' || !item.name.trim()) {
        return 'Item name is required.';
    }

    if (typeof item.type !== 'string' || !item.type.trim()) {
        return 'Item type is required.';
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 0) {
        return 'Quantity must be a non-negative integer.';
    }

    if (typeof item.locationId !== 'string' ||
        !ObjectId.isValid(item.locationId)) {
        return 'A valid locationId is required.';
    }

    for (const field of ['serialNumber', 'condition', 'notes']) {
        if (item[field] != null && typeof item[field] !== 'string') {
            return `${field} must be a string or null.`;
        }
    }

    return null;
};

// Build a consistent inventory document
const buildItem = (body) => ({
    name: body.name.trim(),
    serialNumber: body.serialNumber ?? null,
    type: body.type.trim(),
    quantity: body.quantity,
    locationId: new ObjectId(body.locationId),
    condition: body.condition ?? null,
    notes: body.notes ?? null,
    updatedAt: new Date()
});

// GET all inventory items
const getAll = async (req, res, next) => {
    try {
        const items = await MongoDB.getDb()
            .collection('items')
            .find()
            .toArray();

        res.status(200).json(items);
    } catch (error) {
        next(error);
    }
};

// GET a single inventory item
const getSingleItem = async (req, res, next) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const itemId = new ObjectId(req.params.id);

        const item = await MongoDB.getDb()
            .collection('items')
            .findOne({ _id: itemId });

        if (!item) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
};

// GET an inventory item by serial number
const getBySerialNumber = async (req, res, next) => {
    try {
        const serialNumber = req.params.serialNumber.trim();

        if (!serialNumber) {
            return res.status(400).json({
                message: 'A serial number is required.'
            });
        }

        const item = await MongoDB.getDb()
            .collection('items')
            .findOne({ serialNumber: serialNumber });

        if (!item) {
            return res.status(404).json({
                message: 'No item found with that serial number.'
            });
        }

        res.status(200).json(item);

    } catch (error) {
        next(error);
    }
};

// POST a new inventory item
const createItem = async (req, res, next) => {
    try {
        const validationError = validateItem(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const db = MongoDB.getDb();

        const location = await db.collection('locations').findOne({
            _id: new ObjectId(req.body.locationId)
        });

        if (!location) {
            return res.status(400).json({
                message: 'The specified location does not exist.'
            });
        }

        const item = {
            ...buildItem(req.body),
            createdAt: new Date()
        };

        const result = await db.collection('items').insertOne(item);

        if (result.acknowledged) {
            return res.status(201).json({
                message: 'Item created successfully.',
                id: result.insertedId
            });
        }

        res.status(500).json({
            message: 'Unable to create item.'
        });
    } catch (error) {
        next(error);
    }
};

// PUT - Update an inventory item
const updateItem = async (req, res, next) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const validationError = validateItem(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const db = MongoDB.getDb();

        const location = await db.collection('locations').findOne({
            _id: new ObjectId(req.body.locationId)
        });

        if (!location) {
            return res.status(400).json({
                message: 'The specified location does not exist.'
            });
        }

        const itemId = new ObjectId(req.params.id);
        const item = buildItem(req.body);

        const result = await db.collection('items').updateOne(
            { _id: itemId },
            { $set: item }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// DELETE an inventory item
const deleteItem = async (req, res, next) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid item ID.'
            });
        }

        const itemId = new ObjectId(req.params.id);

        const result = await MongoDB.getDb()
            .collection('items')
            .deleteOne({ _id: itemId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Item not found.'
            });
        }

        res.status(200).json({
            message: 'Item deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getAll,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
    getBySerialNumber
};
