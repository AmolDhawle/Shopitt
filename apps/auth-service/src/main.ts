import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@shopitt/error-handler';
import router from './routes/auth.router';
import webhookRouter from './routes/webhook.router';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';

// Swagger files
const authSwaggerPath = path.join(__dirname, 'swagger/swagger-auth.json');
const authSwaggerDocument = JSON.parse(
  fs.readFileSync(authSwaggerPath, 'utf8'),
);

const webhookSwaggerPath = path.join(
  __dirname,
  'swagger/swagger-webhooks.json',
);
const webhookSwaggerDocument = JSON.parse(
  fs.readFileSync(webhookSwaggerPath, 'utf8'),
);

const port = process.env.PORT ? Number(process.env.PORT) : 6001;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Routes
app.use('/api', router);
app.use('/webhooks', webhookRouter);

app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

// Swagger UIs
app.use(
  '/api-docs/auth',
  swaggerUi.serveFiles(authSwaggerDocument),
  swaggerUi.setup(authSwaggerDocument),
);
app.use(
  '/api-docs/webhooks',
  swaggerUi.serveFiles(webhookSwaggerDocument),
  swaggerUi.setup(webhookSwaggerDocument),
);

app.get('/docs-json/auth', (req, res) => {
  res.json(authSwaggerDocument);
});

app.get('/docs-json/webhooks', (req, res) => {
  res.json(webhookSwaggerDocument);
});

const server = app.listen(port, () => {
  console.log(`Listening at http:/  /localhost:${port}/api`);
  console.log(`Auth docs → http://localhost:${port}/api-docs/auth`);
  console.log(`Webhook docs → http://localhost:${port}/api-docs/webhooks`);
});
server.on('error', console.error);
