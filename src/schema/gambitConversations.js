import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';
import { GraphQLDateTime } from 'graphql-iso-date';

import Loader from '../loader';
import {
  getConversations,
  getConversationsByUserId,
} from '../repositories/gambitConversations';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  # A DoSomething.org user conversation.
  type Conversation {
    # The conversation ID.
    id: String!
    # The Northstar user ID of the user who created this conversation.
    userId: String!
    # The conversation platform (e.g. 'sms', 'gambit-slack').
    platform: String!
    # The time when this conversation was originally created.
    createdAt: DateTime
    # The time this conversation was last modified.
    updatedAt: DateTime
    # The current topic ID.
    topic: String!
  }

  type Query {
    # Get a conversation by ID.
    conversation(id: String!): Conversation
    # Get a paginated collection of conversations.
    conversations(
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Conversation]
    # Get a paginated collection of conversations by user ID.
    conversationsByUserId(
      # The Northstar user ID to filter posts by.
      id: String!
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Conversation]
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    conversation: (_, args, context) =>
      Loader(context).conversations.load(args.id),
    conversations: (_, args, context) => getConversations(args, context),
    conversationsByUserId: (_, args, context) =>
      getConversationsByUserId(args, context),
  },
  DateTime: GraphQLDateTime,
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
