import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
// import swaggerUi from "swagger-ui-express";
import proxy from 'express-http-proxy';
import cookieParser from 'cookie-parser';
// import axios from "axios";
import e from 'express';
import initializeSiteConfig from './libs/initializeSiteConfig';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.set('trust proxy', 1); // Required when using req.ip + rate limiting behind proxy

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: e.Request) => {
    const ip = req.ip ?? '0.0.0.0';
    return ipKeyGenerator(ip);
  },
});
app.use(limiter);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use('/product', proxy('http://localhost:6002')); // Product Service
app.use('/', proxy('http://localhost:6001')); // Auth Service

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log('Site config initialized successfully.');
  } catch (error) {
    console.log('Failed to initialize site config:', error);
  }
});
server.on('error', console.error);
