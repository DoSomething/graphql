import { Router } from 'express';
import { graphqlExpress } from 'apollo-server-express';
import bodyParser from 'body-parser';

import schema from '../schema';
import config from '../../config';

const router = Router();

const usingApolloEngine = Boolean(config('engine.key'));

// * /graphql
router.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(request => ({
    context: { authorization: request.header('authorization') },
    cacheControl: usingApolloEngine,
    tracing: usingApolloEngine,
    schema,
  })),
);

export default router;
