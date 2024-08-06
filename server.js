import express from 'express';
import routes from './routes/index';

let port = 5000;
if (process.env.PORT) port = process.env.PORT;

const app = express();
app.use(express.json());
// app.use(express.urlencoded());
app.use(routes);

app.listen(port);
