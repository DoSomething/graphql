import { GraphQLAbsoluteUrl } from 'graphql-url';

import Loader from '../loader';
import { stringToEnum } from './helpers';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Embed: {
    type: embed => stringToEnum(embed.type),
  },
  Query: {
    embed: (_, args, context) => Loader(context).embeds.load(args.url),
  },
};

export default resolvers;
