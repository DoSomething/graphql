import { makeExecutableSchema } from 'graphql-tools';
import { gql } from 'apollo-server';

import resolvers from '../resolvers/gambit';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  type Query {
    "Get a conversation by ID."
    conversation(id: String!): Conversation
    "Get a paginated collection of conversations."
    conversations(
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Conversation]
    "Get a paginated collection of conversations by user ID."
    conversationsByUserId(
      "The user ID to filter conversations by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Conversation]
    "Get a message by ID."
    message(id: String!): Message
    "Get a paginated collection of messages."
    messages(
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Message]
    "Get a paginated collection of messages by conversation ID."
    messagesByConversationId(
      "The conversation ID to filter messages by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Message]
  }

  "A DoSomething.org user conversation."
  type Conversation {
    "The conversation ID."
    id: String!
    "The Northstar user ID of the user this conversation is with."
    userId: String!
    "The conversation platform (e.g. 'sms', 'gambit-slack')."
    platform: String!
    "The time when this conversation was originally created."
    createdAt: DateTime
    "The time this conversation was last modified."
    updatedAt: DateTime
    "The topic ID of current conversation topic."
    topicId: String!
    "The messages in this conversation."
    messages: [Message]
  }

  "A conversation message."
  type Message {
    "The message ID."
    id: String!
    "The message direction."
    direction: String!
    "The user ID this message is from or to."
    userId: String
    "The time when this conversation was originally created."
    createdAt: DateTime
    "The time this conversation was last modified."
    updatedAt: DateTime
    "The topic ID of the conversation topic when message was created."
    topicId: String
    "The message template (if outbound)."
    template: String
    "The Rivescript trigger that was matched."
    match: String
  }
`;

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
