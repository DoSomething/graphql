import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';

import Loader from '../loader';

import { getBroadcasts } from '../repositories/gambitContent';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  # A DoSomething.org chatbot topic.
  type Topic {
    # The topic ID.
    id: String
    # The topic name.
    name: String
    # The topic type (e.g. 'photoPostConfig', 'askYesNo').
    type: String
    # The topic campaign ID (optional)
    campaignId: Int
  }

  # A DoSomething.org chatbot broadcast.
  type Broadcast {
    # The broadcast ID.
    id: String
    # The broadcast name.
    name: String
    # The broadcast type (e.g. 'photoPostBroadcast', 'askYesNo').
    type: String
    # The broadcast text
    text: String
  }

  type Query {
    # Get a broadcast by ID.
    broadcast(id: String!): Broadcast
    # Get a paginated collection of broadcasts.
    broadcasts(
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Broadcast]
    # Get a topic by ID.
    topic(id: String!): Topic
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    broadcast: (_, args, context) => Loader(context).broadcasts.load(args.id),
    broadcasts: (_, args, context) => getBroadcasts(args, context),
    topic: (_, args, context) => Loader(context).topics.load(args.id),
  },
};

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
