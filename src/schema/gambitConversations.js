import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';
import { GraphQLDateTime } from 'graphql-iso-date';

import Loader from '../loader';
import {
  getConversations,
  getConversationsByUserId,
  getMessageById,
  getMessagesByConversationId,
} from '../repositories/gambitConversations';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  # A DoSomething.org conversation.
  type Conversation {
    # The conversation ID.
    id: String!
    # The Northstar user ID of the user this conversation is with.
    userId: String!
    # The conversation platform (e.g. 'sms', 'gambit-slack').
    platform: String!
    # The time when this conversation was originally created.
    createdAt: DateTime
    # The time this conversation was last modified.
    updatedAt: DateTime
    # The topic ID of current conversation topic.
    topicId: String!
    # The messages in this conversation.
    messages: [Message]
  }

  # A conversation message.
  type Message {
    # The message ID.
    id: String!
    # The message direction.
    direction: String!
    # The user ID this message is from or to.
    userId: String
    # The time when this conversation was originally created.
    createdAt: DateTime
    # The time this conversation was last modified.
    updatedAt: DateTime
    # The topic ID of the conversation topic when message was created.
    topicId: String
    # The message text
    text: String
    # The message template (if outbound)
    template: String
    # The Rivescript match (if inbound)
    match: String
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
    # Get a message by ID.
    message(id: String!): Message
    # Get a paginated collection of messages by conversation ID.
    messagesByConversationId(
      # The Gambit conversation ID to filter messages by.
      id: String!
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Message]
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Conversation: {
    messages: (_, args, context) =>
      getMessagesByConversationId(args.id, args.page, args.count, context),
  },
  Query: {
    conversation: (_, args, context) =>
      Loader(context).conversations.load(args.id),
    conversations: (_, args, context) => getConversations(args, context),
    conversationsByUserId: (_, args, context) =>
      getConversationsByUserId(args, context),
    message: (_, args, context) => getMessageById(args.id, context),
    messagesByConversationId: (_, args, context) =>
      getMessagesByConversationId(args.id, args.page, args.count, context),
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
