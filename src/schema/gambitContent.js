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

const broadcastFields = `
  ${entryFields}
  # The broadcast text to send
  text: String
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

  # A hardcoded chatbot topic.
  type RivescriptTopic implements Topic {
    # The Rivescript topic (e.g. 'unsubscribed', 'support')
    id: String
    name: String
    # The topic type
    type: String
  }

  # An auto reply chatbot topic (creates signup if has a campaign).
  type AutoReplyTopic implements Topic {
    ${entryFields}
    # The campaign to create signup for if conversation changes to this topic (optional).
    campaignId: Int
    # The auto reply text.
    autoReply: String!
  }

  # A chatbot topic to create photo posts.
  type PhotoPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and photo post for if conversation changes to this topic.
    campaignId: Int!
    # Template that asks user to reply with quantity.
    askQuantity: String!
    # Template that asks user to resend a message with valid quantity.
    invalidQuantity: String!
    # Template that asks user to reply with a photo.
    askPhoto: String!
    # Template that asks user to resend a message with a valid photo.
    invalidPhoto: String!
  }

  # A chatbot topic to create text posts.
  type TextPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and text post for if conversation changes to this topic.
    campaignId: Int!
    # Template that asks user to resend a message with valid text post.
    invalidText: String!
    # Template that confirms a text post was created.
    completedTextPost: String!
  }

  # A DoSomething.org chatbot broadcast.
  interface Broadcast {
    ${broadcastFields}
  }

  type AutoReplyBroadcast implements Broadcast {
    ${broadcastFields}
    # The auto reply topic ID to change conversation to.
    topicId: String!
    # The auto reply topic to change conversation to.
    topic: AutoReplyTopic
  }

  type PhotoPostBroadcast implements Broadcast {
    ${broadcastFields}
    # The photo post topic ID to change conversation to.
    topicId: String!
    # The photo post topic to change conversation to.
    topic: PhotoPostTopic
  }

  type TextPostBroadcast implements Broadcast {
    ${broadcastFields}
    # The text post Topic ID to change conversation to.
    topicId: String!
    # The text post topic to change conversation to.
    topic: TextPostTopic
  }

  type LegacyBroadcast implements Broadcast {
    ${broadcastFields}
  }

  type Query {
    # Get a Auto Reply Broadcast by ID.
    autoReplyBroadcast(id: String!): AutoReplyBroadcast
    # Get a Auto Reply Broadcast by ID.
    autoReplyTopic(id: String!): AutoReplyBroadcast
    # Get a broadcast by ID.
    broadcast(id: String!): Broadcast
    # Get a paginated collection of broadcasts.
    broadcasts(
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Broadcast]
    # Get a Photo Post Broadcast by ID.
    photoPostBroadcast(id: String!): PhotoPostBroadcast
    # Get a Photo Post Topic by ID.
    photoPostTopic(id: String!): PhotoPostTopic
    # Get a Text Post Broadcast by ID.
    textPostBroadcast(id: String!): TextPostBroadcast
    # Get a Text Post Topic by ID.
    textPostTopic(id: String!): TextPostTopic
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
  AutoReplyBroadcast: {
    topic: (broadcast, args, context) =>
      Loader(context).topics.load(broadcast.topicId, context),
  },
  Broadcast: {
    __resolveType(broadcast) {
      if (broadcast.type === 'autoReplyBroadcast') {
        return 'AutoReplyBroadcast';
      }
      if (broadcast.type === 'photoPostBroadcast') {
        return 'PhotoPostBroadcast';
      }
      if (broadcast.type === 'textPostBroadcast') {
        return 'TextPostBroadcast';
      }
      return 'LegacyBroadcast';
    },
  },
  Query: {
    autoReplyBroadcast: (_, args, context) =>
      Loader(context).broadcasts.load(args.id),
    autoReplyTopic: (_, args, context) => Loader(context).topics.load(args.id),
    broadcast: (_, args, context) => Loader(context).broadcasts.load(args.id),
    broadcasts: (_, args, context) => getBroadcasts(args, context),
    photoPostBroadcast: (_, args, context) =>
      Loader(context).broadcasts.load(args.id),
    photoPostTopic: (_, args, context) => Loader(context).topics.load(args.id),
    textPostBroadcast: (_, args, context) =>
      Loader(context).broadcasts.load(args.id),
    textPostTopic: (_, args, context) => Loader(context).topics.load(args.id),
    topic: (_, args, context) => Loader(context).topics.load(args.id),
  },
  PhotoPostBroadcast: {
    topic: (broadcast, args, context) =>
      Loader(context).topics.load(broadcast.topicId, context),
  },
  TextPostBroadcast: {
    topic: (broadcast, args, context) =>
      Loader(context).topics.load(broadcast.topicId, context),
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
