import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Seller Service API',
    description: 'API for seller service',
    version: '1.0.0',
  },
  host: 'localhost:6003',
  basePath: '/seller/api',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../src/routes/seller.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully.');
});
