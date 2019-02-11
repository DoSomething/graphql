//
// This is our AWS Lambda entry point.
//

// Attach global 'fetch' polyfill.
fetch = require('node-fetch');

const { ApolloServer } = require('apollo-server-lambda');
const schema = require('./lib/src/schema').default;

const server = new ApolloServer({
  schema,
  cacheControl: true, // Send 'Cache-Control' headers where needed.
  introspection: true, // Enable introspection in our production environment.
  playground: true, // Enable playground on production for exploration & debugging.
  tracing: true, // Enable tracing on requests.
});

exports.handler = function(event, context, callback) {
  // For some reason `event.path` doesn't include API gateway stage, so we get
  // '/graphql' instead of the real '/development/graphql' path. This conflicts
  // with what the documentation linked on this PR shows. <https://git.io/fhrEp>.
  // @TODO: Is this a bug with our API Gateway config?
  event.path = event.requestContext.path; // eslint-disable-line

  // Enable CORS for cross-domain usage.
  const handlerSettings = {
    cors: {
      origin: true,
      credentials: true,
    },
  };

  server.createHandler(handlerSettings)(event, context, callback);
};
