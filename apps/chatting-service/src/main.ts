import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { errorMiddleware } from '@shopitt/error-handler';
import router from './routes/chatting.routes';
import { createWebSocketServer } from './websocket';
import { startConsumer } from './chat-message.consumer';

// Swagger files
const chattingSwagger = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'swagger/swagger-output.json'), 'utf8'),
);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to chatting-service!' });
});

// routes
app.use('/api', router);
app.use(errorMiddleware);

// Swagger UIs
app.use(
  '/api-docs/chatting',
  swaggerUi.serveFiles(chattingSwagger),
  swaggerUi.setup(chattingSwagger),
);

app.get('/docs-json/chatting', (req, res) => {
  res.json(chattingSwagger);
});

const port = process.env.PORT || 6006;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

// Websocket server
createWebSocketServer(server);

// start kafka consumer
startConsumer().catch((error: any) => {
  console.log(error);
});

server.on('error', console.error);
