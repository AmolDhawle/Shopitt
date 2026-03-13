import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Admin Service API',
    description: 'API for admin service',
    version: '1.0.0',
  },
  host: 'localhost:6005',
  basePath: '/admin/api',
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/admin.routes.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully.');
});
