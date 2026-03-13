import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { errorMiddleware } from '@shopitt/error-handler';
import router from './routes/admin.routes';

// Swagger files
const adminSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger-output.json'), 'utf8'),
);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to admin-service!' });
});

// routes
app.use('/api', router);
app.use(errorMiddleware);

// Swagger UIs
app.use(
  '/api-docs/admin',
  swaggerUi.serveFiles(adminSwagger),
  swaggerUi.setup(adminSwagger),
);

app.get('/docs-json/admin', (req, res) => {
  res.json(adminSwagger);
});

const port = process.env.PORT || 6005;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
