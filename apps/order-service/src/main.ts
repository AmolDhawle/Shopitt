import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import router from './routes/order.routes';
import { stripeWebhook } from './controllers/order.controller';
import { errorMiddleware } from '@shopitt/error-handler';

const port = Number(process.env.PORT) || 6004;
const app = express();

// CORS
app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Stripe webhook route
app.post(
  '/api/webhook/stripe',
  bodyParser.raw({ type: 'application/json' }),
  stripeWebhook,
);

//  Parse JSON for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api', router);

// Swagger files
const orderSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger/swagger-output.json'), 'utf8'),
);
app.use(
  '/api-docs/order',
  swaggerUi.serveFiles(orderSwagger),
  swaggerUi.setup(orderSwagger),
);
app.get('/docs-json/order', (req, res) => res.json(orderSwagger));

// Error middleware
app.use(errorMiddleware);

// Health check
app.get('/health', (req, res) => res.send({ message: 'Hello Order API' }));

// Start server
app.listen(port, () => {
  console.log(`Order API running → http://localhost:${port}/api`);
  console.log(`Swagger → http://localhost:${port}/api-docs/order`);
});
