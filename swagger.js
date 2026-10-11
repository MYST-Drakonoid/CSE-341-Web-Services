import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Contacts API',
    description: 'REST API for managing contacts',
    version: '1.0.0'
  },
  servers: [
    {
      url: '/contacts'
    }
  ],


  components: {
  schemas: {
    ContactInput: {
      $firstName: 'John',
      $lastName: 'Doe',
      $email: 'john@example.com',
      $favoriteColor: 'Blue',
      $birthday: '1990-01-15'
    }
  }
}
};

const outputFile = './swagger.json';

const endpointsFiles = ['./routes/contacts.js'];

swaggerAutogen({ openapi: '3.0.0' })(
  outputFile,
  endpointsFiles,
  doc
);