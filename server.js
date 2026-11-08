import express from 'express';
import { json } from 'body-parser';
import { initDb } from './db/connect.js';
import methodOverride from 'method-override';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import inventoryRoutes from './routes/inventory.js';
import locationRoutes from './routes/locations.js';
import pkg from 'express-openid-connect';

const { auth, requiresAuth } = pkg;

const port = process.env.PORT || 8080;
const app = express();

// Trust Render's HTTPS reverse proxy in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
  
// Initialize Auth0 authentication
app.use(auth({
    authRequired: true,
    auth0Logout: true,
    secret: process.env.SESSION_SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
}));

app.get('/auth/status', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    res.status(200).json({
        authenticated: req.oidc.isAuthenticated()
    });
});

app.use(express.static('public'));

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./swagger.json', import.meta.url), 'utf8')
);

app.get('/profile', requiresAuth(), (req, res) => {
    res.status(200).json({
        message: 'Authentication successful',
        name: req.oidc.user.name,
        email: req.oidc.user.email
    });
});

app
  .use(json())
  .use(express.urlencoded({ extended: true }))
  .use(methodOverride('_method'))
  .use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  })

  // Swagger interface
  .use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customJs: [
      '/auth-bar.js',
      '/inventory-editor.js'
    ],
    customCssUrl: [
      '/auth-bar.css',
      '/inventory-editor.css'
    ],
    customSiteTitle: 'Household Inventory Tracker'
  }))

  // API routes
  .use('/api/inventory', inventoryRoutes)
  .use('/api/locations', locationRoutes)

  // Original root routes
  .use('/', (await import('./routes/index.js')).default)


  // Handle missing routes
  .use((req, res) => {
    res.status(404).json({
      message: 'Route not found'
    });
  })

  // Centralized error handling
  .use((err, req, res, next) => {
    console.error('API Error:', err);

    const status = err.status || err.statusCode || 500;
    const code = status >= 400 && status <= 599 ? status : 500;

    res.status(code).json({
      message: code >= 500
        ? 'Internal server error.'
        : err.message
    });
  });

initDb((err, mongodb) => {
  if (err) {
    console.log(err);
  } else {
    app.listen(port);
    console.log(`Connected to DB and listening on ${port}`);
  }
});
