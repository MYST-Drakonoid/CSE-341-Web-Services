import * as MongoDB from '../db/connect.js';
import { ObjectId } from 'mongodb';

// GET all locations
const getAll = async (req, res, next) => {
    try {
        const locations = await MongoDB.getDb()
            .collection('locations')
            .find()
            .toArray();

        res.status(200).json(locations);
    } catch (error) {
        next(error);
    }
};

// POST a new location
const createLocation = async (req, res, next) => {
    try {
        if (typeof req.body?.name !== 'string' ||
            !req.body.name.trim()) {
            return res.status(400).json({
                message: 'Location name is required.'
            });
        }

        if ((req.body.room != null && typeof req.body.room !== 'string') ||
            (req.body.notes != null && typeof req.body.notes !== 'string')) {
            return res.status(400).json({
                message: 'Room and notes must be strings or null.'
            });
}

        const location = {
            name: req.body.name.trim(),
            room: req.body.room ?? null,
            parentLocationId: null,
            notes: req.body.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await MongoDB.getDb()
            .collection('locations')
            .insertOne(location);

        res.status(201).json({
            message: 'Location created successfully.',
            id: result.insertedId
        });
    } catch (error) {
        next(error);
    }
};


// PUT - Update an existing location
const updateLocation = async (req, res, next) => {
    try {
        // Validate MongoDB ID
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid location ID.'
            });
        }

        // Validate location name
        if (typeof req.body?.name !== 'string' ||
            !req.body.name.trim()) {
            return res.status(400).json({
                message: 'Location name is required.'
            });
        }

        // Validate optional fields
        if ((req.body.room != null && typeof req.body.room !== 'string') ||
            (req.body.notes != null && typeof req.body.notes !== 'string')) {
            return res.status(400).json({
                message: 'Room and notes must be strings or null.'
            });
        }

        const locationId = new ObjectId(req.params.id);

        const location = {
            name: req.body.name.trim(),
            room: req.body.room ?? null,
            notes: req.body.notes ?? null,
            updatedAt: new Date()
        };

        const result = await MongoDB.getDb()
            .collection('locations')
            .updateOne(
                { _id: locationId },
                { $set: location }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Location not found.'
            });
        }

        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

const deleteLocation = async (req, res, next) => {
    try {
        // Validate location ID
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid location ID.'
            });
        }

        const locationId = new ObjectId(req.params.id);
        const db = MongoDB.getDb();

        // Check whether the location exists
        const location = await db.collection('locations')
            .findOne({ _id: locationId });

        if (!location) {
            return res.status(404).json({
                message: 'Location not found.'
            });
        }

        // Check whether inventory items reference this location
        const itemCount = await db.collection('items')
            .countDocuments({ locationId: locationId });

        if (itemCount > 0) {
            return res.status(409).json({
                message: 'Cannot delete a location containing inventory items.',
                itemsFound: itemCount
            });
        }

        // Delete the location
        const result = await db.collection('locations')
            .deleteOne({ _id: locationId });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Location not found.'
            });
        }

        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

export default {
    getAll,
    createLocation,
    updateLocation,
    deleteLocation
};