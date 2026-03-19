import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@shopitt/error-handler';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import router from './routes/seller.routes';

// Swagger files
const userSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger/swagger-output.json'), 'utf8'),
);
const port = process.env.PORT ? Number(process.env.PORT) : 6007;

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
  res.send({ message: 'Hello Seller API' });
});

// Swagger UIs
app.use(
  '/api-docs/seller',
  swaggerUi.serveFiles(userSwagger),
  swaggerUi.setup(userSwagger),
);

app.get('/docs-json/seller', (req, res) => {
  res.json(userSwagger);
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(`Seller docs → http://localhost:${port}/api-docs/seller`);
});
server.on('error', console.error);
