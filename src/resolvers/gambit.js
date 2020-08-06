import { GraphQLDateTime } from 'graphql-iso-date';

import Loader from '../loader';
import {
  getConversations,
  getConversationsByUserId,
  getMessageById,
  getMessages,
  getMessagesByConversationId,
} from '../repositories/gambit';

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
    message: (_, args, context) => getMessageById(args.id, context),
    messages: (_, args, context) => getMessages(args, context),
    messagesByConversationId: (_, args, context) =>
      getMessagesByConversationId(args.id, args.page, args.count, context),
  },

  Conversation: {
    messages: (_, args, context) =>
      getMessagesByConversationId(args.id, args.page, args.count, context),
  },

  DateTime: GraphQLDateTime,
};

export default resolvers;
