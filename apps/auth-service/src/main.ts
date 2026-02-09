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
const authSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger-auth.json'), 'utf8'),
);

const webhookSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger-webhooks.json'), 'utf8'),
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
  swaggerUi.serveFiles(authSwagger),
  swaggerUi.setup(authSwagger),
);
app.use(
  '/api-docs/webhooks',
  swaggerUi.serveFiles(webhookSwagger),
  swaggerUi.setup(webhookSwagger),
);

app.get('/docs-json/auth', (req, res) => {
  res.json(authSwagger);
});

app.get('/docs-json/webhooks', (req, res) => {
  res.json(webhookSwagger);
});

const server = app.listen(port, () => {
  console.log(`Listening at http:/  /localhost:${port}/api`);
  console.log(`Auth docs → http://localhost:${port}/api-docs/auth`);
  console.log(`Webhook docs → http://localhost:${port}/api-docs/webhooks`);
});
server.on('error', console.error);
