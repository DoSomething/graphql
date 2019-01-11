import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';

import Loader from '../loader';

import { getBroadcasts } from '../repositories/gambitContent';

const entryFields = `
  # The entry ID.
  id: String
  # The entry name.
  name: String
  # The entry type (e.g. 'photoPostConfig', 'askYesNo').
  type: String
`;

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  # A DoSomething.org chatbot topic.
  interface Topic {
    ${entryFields}
  }

  type RivescriptTopic implements Topic {
    # The Rivescript topic (e.g. 'unsubscribed', 'support')
    id: String
    name: String
    # The topic type
    type: String
  }

  type AutoReplyTopic implements Topic {
    ${entryFields}
    # The campaign to create signup for if conversation changes to this topic (optional).
    campaignId: Int
    # The auto reply text.
    text: String
  }

  type PhotoPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and photo post for if conversation changes to this topic.
    campaignId: Int
    # Template that asks user to reply with quantity.
    askQuantity: String
    # Template that asks user to resend a message with valid quantity.
    invalidQuantity: String
    # Template that asks user to reply with a photo.
    askPhoto: String
    # Template that asks user to resend a message with a valid photo.
    invalidPhoto: String
  }

  type TextPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and text post for if conversation changes to this topic.
    campaignId: Int
    # Template that asks user to resend a message with valid text post.
    invalidText: String
    # Template that confirms a text post was created.
    completedTextPost: String
  }

  # A DoSomething.org chatbot broadcast.
  type Broadcast {
    ${entryFields}
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
  Topic: {
    __resolveType(topic) {
      if (topic.type === 'autoReply') {
        return 'AutoReplyTopic';
      }
      if (topic.type === 'photoPostConfig') {
        return 'PhotoPostTopic';
      }
      if (topic.type === 'textPostConfig') {
        return 'TextPostTopic';
      }
      return 'RivescriptTopic';
    },
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
