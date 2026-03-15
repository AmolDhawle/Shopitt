import swaggerAutogen from 'swagger-autogen';

const doc = {
  swagger: '2.0',
  info: {
    title: 'Webhook API',
    description: 'Payment & third-party webhooks',
    version: '1.0.0',
  },
  host: 'localhost:6001',
  basePath: '/webhooks',
  schemes: ['http'],
};

const outputFile = './swagger-webhooks.json';
const endpointsFiles = ['../src/routes/webhook.router.ts'];

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log('Webhook swagger generated');
});
