import { Router } from 'express';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';

import schema from '../schema';
import config from '../../config';

const router = Router();

const usingApolloEngine = Boolean(config('engine.key'));

const server = new ApolloServer({ schema });
server.applyMiddleware({ router });

// * /graphql
router.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(request => ({
    context: { authorization: request.headers.authorization },
    cacheControl: usingApolloEngine,
    tracing: usingApolloEngine,
    schema,
  })),
);

export default router;
