import express from 'express';
import { json } from 'body-parser';
import { initDb } from './db/connect.js';
import methodOverride from 'method-override';

const port = process.env.PORT || 8080;
const app = express();


app
  .use(json())
  .use(express.urlencoded({ extended: true }))
  .use(methodOverride('_method'))
  .use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  })
  .use('/', (await import('./routes/index.js')).default)
  .use('/contacts', (await import('./routes/contacts.js')).default)
  .use((req, res, next) => {
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
