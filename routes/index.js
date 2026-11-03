// import express from 'express';
// import * as myController from '../controllers/index.js';

// const routes = express.Router();

// routes.get('/', myController.namefunc);

// routes.get('/real', myController.namefunc2);

// export default routes;

import express from 'express';

const router = express.Router();


router.get('/', (req, res) => {
    if (req.oidc?.isAuthenticated()) {
        res.redirect('/api-docs/');
    } else {
        res.redirect('/login');
    }
});

router.get('/', (req, res) => {
    res.redirect('/api-docs/');
});

export default router;