import { Router } from 'express';
import { graphqlExpress } from 'apollo-server-express';
import bodyParser from 'body-parser';
import { schema } from '../schema';

const router = Router();

// * /graphql
router.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
  context: { authorization: request.header('authorization') },
  schema
})));

export default router;
