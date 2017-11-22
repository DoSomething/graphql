import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { schema } from './schema';

var app = express();

// POST /graphql
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

// GET /graphiql
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// Start it up!
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`GraphQL Server is now running on http://localhost:${PORT}/graphql`);
  console.log(`View GraphiQL at http://localhost:${PORT}/graphiql`);
});

