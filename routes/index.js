import express from 'express';
import * as myController from '../controllers/index.js';

const routes = express.Router();

routes.get('/', myController.namefunc);

routes.get('/real', myController.namefunc2);

export default routes;