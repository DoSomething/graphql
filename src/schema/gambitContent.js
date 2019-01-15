import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';

import Loader from '../loader';

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
  # Message to broadcast
  text: String
`;

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  # A DoSomething.org conversation topic.
  interface Topic {
    ${entryFields}
  }

  # A hardcoded conversation topic.
  type RivescriptTopic implements Topic {
    # The Rivescript topic (e.g. 'unsubscribed', 'support')
    id: String
    name: String
    # The topic type
    type: String
  }

  # Topic for sending an auto-reply message (creates signup if it has a campaign set)
  type AutoReplyTopic implements Topic {
    ${entryFields}
    # The campaign to create signup for if conversation changes to this topic (optional).
    campaignId: Int
    # The auto reply text.
    autoReply: String!
  }

  # Topic for creating signup and photo posts. Asks user to text START to begin a photo post.
  type PhotoPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and photo post for if conversation changes to this topic.
    campaignId: Int
    # Template sent until user replies with START to begin a photo post.
    startPhotoPostAutoReply: String!
    # Template that asks user to reply with quantity.
    askQuantity: String!
    # Template that asks user to resend a message with valid quantity.
    invalidQuantity: String!
    # Template that asks user to reply with a photo.
    askPhoto: String!
    # Template that asks user to resend a message with a photo.
    invalidPhoto: String!
    # Template that asks user to reply with a photo caption.
    askCaption: String!
    # Template that asks user to resend a message with a valid photo caption.
    invalidCaption: String!
    # Template that asks user to reply with why participated.
    askWhyParticipated: String!
    # Template that asks user to resend a message with a valid why participated.
    invalidWhyParticipated: String!
    # Template that confirms a photo post was created.
    completedPhotoPost: String!
    # Template sent after photo post confirmation. User can text START to submit another photo post.
    completedPhotoPostAutoReply: String!
  }

  # Topic for creating signup and text posts. Ask user to text back a test post.
  type TextPostTopic implements Topic {
    ${entryFields}
    # The campaign to create signup and text post for if conversation changes to this topic.
    campaignId: Int
    # Template that asks user to resend a message with valid text post.
    invalidText: String!
    # Template that confirms a text post was created. Replying to this creates another text post.
    completedTextPost: String!
  }

  # A DoSomething.org broadcast.
  interface Broadcast {
    ${broadcastFields}
  }

  # Broadcast that asks user a yes or no question, and changes topic to its own ID.
  type AskYesNoBroadcastTopic implements Broadcast, Topic {
    ${broadcastFields}
    # Message sent if user says yes.
    saidYes: String!
    # The topic ID to change conversation to if user says yes 
    saidYesTopicId: String!
    # The topic to change conversation to if user says yes.
    saidYesTopic: Topic
    # Message sent if user says yes 
    saidNo: String!
    # The topic ID to change conversation to if user says no.
    saidNoTopicId: String!
    # The topic to change conversation to if user says no.
    saidNoTopic: Topic
    # Message sent until user responds with yes or no.
    invalidAskYesNoResponse: String!
  }

  # Broadcast that changes topic to an auto reply topic.
  type AutoReplyBroadcast implements Broadcast {
    ${broadcastFields}
    # The auto reply topic ID to change conversation to.
    topicId: String!
    # The auto reply topic to change conversation to.
    topic: AutoReplyTopic
  }

  # Broadcast that asks user to reply with START and changes topic a photo post topic.
  type PhotoPostBroadcast implements Broadcast {
    ${broadcastFields}
    # The photo post topic ID to change conversation to.
    topicId: String!
    # The photo post topic to change conversation to.
    topic: PhotoPostTopic
  }

  # Broadcast that asks user to reply with a text post and changes topic to a text post topic.
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
    # Get a Ask Yes No Broadcast Topic by ID.
    askYesNoBroadcastTopic(id: String!): AskYesNoBroadcastTopic
    # Get a Auto Reply Broadcast by ID.
    autoReplyBroadcast(id: String!): AutoReplyBroadcast
    # Get a Auto Reply Topic by ID.
    autoReplyTopic(id: String!): AutoReplyTopic
    # Get a broadcast by ID.
    broadcast(id: String!): Broadcast
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
  AskYesNoBroadcastTopic: {
    saidNoTopic: (topic, args, context) =>
      Loader(context).topics.load(topic.saidNoTopicId, context),
    saidYesTopic: (topic, args, context) =>
      Loader(context).topics.load(topic.saidYesTopicId, context),
  },
  AutoReplyBroadcast: {
    topic: (broadcast, args, context) =>
      Loader(context).topics.load(broadcast.topicId, context),
  },
  Broadcast: {
    __resolveType(broadcast) {
      if (broadcast.type === 'askYesNo') {
        return 'AskYesNoBroadcastTopic';
      }
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
    askYesNoBroadcastTopic: (_, args, context) =>
      Loader(context).broadcasts.load(args.id),
    autoReplyBroadcast: (_, args, context) =>
      Loader(context).broadcasts.load(args.id),
    autoReplyTopic: (_, args, context) => Loader(context).topics.load(args.id),
    broadcast: (_, args, context) => Loader(context).broadcasts.load(args.id),
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
      if (topic.type === 'askYesNo') {
        return 'AskYesNoBroadcastTopic';
      }
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
