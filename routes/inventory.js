import express from 'express';
import itemsController from '../controllers/inventory.js';

const router = express.Router();

router.get('/', itemsController.getAll);

router.get('/serial/:serialNumber', itemsController.getBySerialNumber);

router.get('/:id', itemsController.getSingleItem);

router.post('/', (req, res, next) => {
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: "#/components/schemas/ItemInput"
                }
            }
        }
    } */

    return itemsController.createItem(req, res, next);
});

router.put('/:id', (req, res, next) => {
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    $ref: "#/components/schemas/ItemInput"
                }
            }
        }
    } */

    return itemsController.updateItem(req, res, next);
});

router.delete('/:id', itemsController.deleteItem);

export default router;