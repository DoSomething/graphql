//
// This is our AWS Lambda entry point.
//

// Attach global 'fetch' polyfill.
fetch = require('node-fetch');

const { ApolloServer } = require('apollo-server-lambda');
const schema = require('./lib/src/schema').default;
const fs = require('fs');

const server = new ApolloServer({
  schema,
  context: ({ event }) => ({
    authorization: event.headers.Authorization,
  }),
  cacheControl: true, // Send 'Cache-Control' headers where needed.
  introspection: true, // Enable introspection in our production environment.
  playground: true, // Enable playground on production for exploration & debugging.
  tracing: true, // Enable tracing on requests.
});

exports.handler = (event, context, callback) => {
  // Render customized GraphQL Playground when client asks for HTML:
  const accept = event.headers.Accept || event.headers.accept;
  if (event.httpMethod === 'GET' && accept && accept.includes('text/html')) {
    return callback(null, {
      statusCode: 200,
      body: fs.readFileSync(`${__dirname}/src/playground.html`),
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  // Enable CORS for cross-domain usage.
  const handlerSettings = {
    cors: {
      origin: '*',
      credentials: true,
      allowedHeaders: ['content-type', 'authorization'],
    },
  };

  return server.createHandler(handlerSettings)(event, context, callback);
};
