import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';

import Loader from '../loader';

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
  }

  type Query {
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
