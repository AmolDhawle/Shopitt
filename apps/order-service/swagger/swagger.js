import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Order Service API',
    description: 'API for order service',
    version: '1.0.0',
  },
  host: 'localhost:6003',
  basePath: '/order/api',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../src/routes/order.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully.');
});
