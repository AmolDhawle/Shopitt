import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Chatting Service API',
    description: 'API for chatting service',
    version: '1.0.0',
  },
  host: 'localhost:6006',
  basePath: '/chatting/api',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../src/routes/chatting.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully.');
});
