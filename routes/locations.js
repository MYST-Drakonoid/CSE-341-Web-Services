import express from 'express';
import locationsController from '../controllers/locations.js';

const router = express.Router();

router.get('/', locationsController.getAll);

router.post('/', (req, res, next) => {
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: "#/components/schemas/LocationInput"
                }
            }
        }
    } */

    return locationsController.createLocation(req, res, next);
});

router.put('/:id', (req, res, next) => {
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: "#/components/schemas/LocationInput"
                }
            }
        }
    } */

    return locationsController.updateLocation(req, res, next);
});

router.delete('/:id', locationsController.deleteLocation);

export default router;