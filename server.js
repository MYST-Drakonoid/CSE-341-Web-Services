import express from 'express';
import { json } from 'body-parser';
import { initDb } from './db/connect.js';
import methodOverride from 'method-override';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import inventoryRoutes from './routes/inventory.js';
import locationRoutes from './routes/locations.js';

const port = process.env.PORT || 8080;
const app = express();

const swaggerDocument = JSON.parse(
  readFileSync(new URL('./swagger.json', import.meta.url), 'utf8')
);

app
  .use(json())
  .use(express.urlencoded({ extended: true }))
  .use(methodOverride('_method'))
  .use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  })

  // Swagger interface
  .use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  // API routes
  .use('/api/inventory', inventoryRoutes)
  .use('/api/locations', locationRoutes)

  // Original root routes
  .use('/', (await import('./routes/index.js')).default)

  // Handle missing routes
  .use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
  

initDb((err, mongodb) => {
  if (err) {
    console.log(err);
  } else {
    app.listen(port);
    console.log(`Connected to DB and listening on ${port}`);
  }
});
