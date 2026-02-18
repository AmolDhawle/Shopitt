import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@shopitt/error-handler';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import router from './routes/product.routes';

// Swagger files
const productSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger-output.json'), 'utf8'),
);
const port = process.env.PORT ? Number(process.env.PORT) : 6002;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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

app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send({ message: 'Hello Product API' });
});

// Swagger UIs
app.use(
  '/api-docs/product',
  swaggerUi.serveFiles(productSwagger),
  swaggerUi.setup(productSwagger),
);

app.get('/docs-json/product', (req, res) => {
  res.json(productSwagger);
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(`Product docs → http://localhost:${port}/api-docs/product`);
});
server.on('error', console.error);
