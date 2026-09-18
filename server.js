import express from 'express';
import routes from './routes/index.js';
const Port = process.env.PORT || 3000;

const app = express();

app.use('/', routes);

app.listen(Port, () => {
    console.log(`Server running at http://localhost:${Port}`);
});