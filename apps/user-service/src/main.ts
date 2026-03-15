import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@shopitt/error-handler';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import router from './routes/user.routes';

// Swagger files
const userSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger/swagger-output.json'), 'utf8'),
);
const port = process.env.PORT ? Number(process.env.PORT) : 6003;

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
  res.send({ message: 'Hello User API' });
});

// Swagger UIs
app.use(
  '/api-docs/user',
  swaggerUi.serveFiles(userSwagger),
  swaggerUi.setup(userSwagger),
);

app.get('/docs-json/user', (req, res) => {
  res.json(userSwagger);
});

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  console.log(`User docs → http://localhost:${port}/api-docs/user`);
});
server.on('error', console.error);
