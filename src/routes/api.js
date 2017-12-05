import { Router } from 'express';
import { graphqlExpress } from 'apollo-server-express';
import bodyParser from 'body-parser';
import apolloEngine from '../middleware/engine';
import schema from '../schema';

const router = Router();

// Attach Apollo Engine proxy:
const engine = apolloEngine();
if (engine) router.use(engine.expressMiddleware());

// * /graphql
router.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(request => ({
    context: { authorization: request.header('authorization') },
    cacheControl: Boolean(engine),
    tracing: Boolean(engine),
    schema,
  })),
);

export default router;
