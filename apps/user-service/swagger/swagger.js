import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'User Service API',
    description: 'API for user service',
    version: '1.0.0',
  },
  host: 'localhost:6003',
  basePath: '/user/api',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['../src/routes/user.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully.');
});
