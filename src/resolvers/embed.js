import { URLResolver } from 'graphql-scalars';

import Loader from '../loader';
import { stringToEnum } from './helpers';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  URL: URLResolver,
  Embed: {
    type: embed => stringToEnum(embed.type),
  },
  Query: {
    embed: (_, args, context) => Loader(context).embeds.load(args.url),
  },
};

export default resolvers;
