import { makeExecutableSchema } from 'graphql-tools';
import { gql } from 'apollo-server';

import {
  getConversationTriggers,
  getWebSignupConfirmations,
} from '../repositories/gambitContent';
import Loader from '../loader';

const entryFields = `
  "The entry ID."
  id: String
  "The entry name."
  name: String
  "The entry content type (e.g. 'photoPostConfig', 'askYesNo')."
  contentType: String
`;

const broadcastFields = `
  ${entryFields}
  "Broadcast message text to send."
  text: String
  "Broadcast message attachments to send."
  attachments: [BroadcastMedia]
`;

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  "A DoSomething.org conversation topic."
  interface Topic {
    ${entryFields}
  }

  "Topic for sending a single auto-reply message."
  type AutoReplyTopic implements Topic {
    ${entryFields}
    "The auto reply text."
    autoReply: String!
  }

  "Topic for creating a signup and sending a single auto-reply message."
  type AutoReplySignupTopic implements Topic {
    ${entryFields}
    "The campaign ID to create signup for if conversation changes to this topic."
    campaignId: Int!
    "Template sent as an auto reply to user messages."
    autoReply: String!
  }

  "Topic for creating signup and photo posts. Asks user to reply with START to create a draft photo post."
  type PhotoPostTopic implements Topic {
    ${entryFields}
    "The campaign ID to create signup and photo post for if conversation changes to this topic."
    campaignId: Int!
    "Template sent until user replies with START to begin a photo post."
    startPhotoPostAutoReply: String!
    "Template that asks user to reply with quantity."
    askQuantity: String!
    "Template that asks user to resend a message with valid quantity."
    invalidQuantity: String!
    "Template that asks user to reply with a photo."
    askPhoto: String!
    "Template that asks user to resend a message with a photo."
    invalidPhoto: String!
    "Template that asks user to reply with a photo caption."
    askCaption: String!
    "Template that asks user to resend a message with a valid photo caption."
    invalidCaption: String!
    "Template that asks user to reply with why participated."
    askWhyParticipated: String!
    "Template that asks user to resend a message with a valid why participated."
    invalidWhyParticipated: String!
    "Template that confirms a photo post was created."
    completedPhotoPost: String!
    "Template sent after photo post confirmation. User can send START to submit another photo post."
    completedPhotoPostAutoReply: String!
  }

  "Topic for creating signup and text posts. Ask user to reply with a text post."
  type TextPostTopic implements Topic {
    ${entryFields}
    "The campaign ID to create signup and text post for if conversation changes to this topic."
    campaignId: Int!
    "Template that asks user to resend a message with valid text post."
    invalidText: String!
    "Template that confirms a text post was created. Replying to this creates another text post."
    completedTextPost: String!
  }

  "Media attached to a broadcast."
  type BroadcastMedia {
    "The broadcast media URL."
    url: String!
    "The broadcast media content type."
    contentType: String!
  }

  "A DoSomething.org broadcast."
  interface Broadcast {
    ${broadcastFields}
  }

  "Broadcast that asks user to confirm SMS status, and changes topic to its own ID."
  type AskSubscriptionStatusBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "Message sent if user says active."
    saidActive: String!
    "The topic ID to change conversation to if user says active."
    saidActiveTopicId: String!
    "The topic to change conversation to if user says active."
    saidActiveTopic: Topic
    "Message sent if user says less."
    saidLess: String!
    "The topic ID to change conversation to if user says less."
    saidLessTopicId: String!
    "The topic to change conversation to if user says less."
    saidLessTopic: Topic
    "Message sent until user responds with a valid subscription status."
    invalidAskSubscriptionStatusResponse: String!
  }

  "Broadcast that asks user a yes or no question, and changes topic to its own ID."
  type AskYesNoBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "Message sent if user says yes."
    saidYes: String!
    "The topic ID to change conversation to if user says yes"
    saidYesTopicId: String!
    "The topic to change conversation to if user says yes."
    saidYesTopic: Topic
    "Message sent if user says yes."
    saidNo: String!
    "The topic ID to change conversation to if user says no."
    saidNoTopicId: String!
    "The topic to change conversation to if user says no."
    saidNoTopic: Topic
    "Message sent until user responds with yes or no."
    invalidAskYesNoResponse: String!
  }

  "Broadcast that changes topic to an AutoReplyTopic."
  type AutoReplyBroadcast implements Broadcast {
    ${broadcastFields}
    "The ID of the AutoReplyTopic to change conversation to."
    topicId: String!
    "The AutoReplyTopic to change conversation to."
    topic: AutoReplyTopic
  }

  "Broadcast that asks user to reply with START and changes topic to a PhotoPostTopic."
  type PhotoPostBroadcast implements Broadcast {
    ${broadcastFields}
    "The ID of the PhotoPostTopic to change conversation to."
    topicId: String!
    "The PhotoPostTopic to change conversation to."
    topic: PhotoPostTopic
  }

  "Broadcast that asks user to reply with a text post and changes topic to a TextPostTopic."
  type TextPostBroadcast implements Broadcast {
    ${broadcastFields}
    "The ID of the TextPostTopic to change conversation to."
    topicId: String!
    "The TextPostBroadcast to change conversation to."
    topic: TextPostTopic
  }

  type LegacyBroadcast implements Broadcast {
    ${broadcastFields}
  }

  "A conversation trigger, used to change topic or answer a FAQ."
  type ConversationTrigger {
    "The entry id."
    id: String!
    "The Rivescript trigger used to match an inbound message from a user."
    trigger: String!
    "The Rivescript reply to send user if their inbound message matches the trigger."
    reply: String!
    "The topic ID to change user conversation to."
    topicId: String
    "The topic to change user conversation to."
    topic: Topic
  }

  "Confirmation to send a user when they sign up for a campaign from web."
  type WebSignupConfirmation {
    "The campaign ID that the user signed up for."
    campaignId: Int!
    "The confirmation message text to the user."
    text: String!
    "The topic ID to change the user conversation to."
    topicId: String!
    "The topic to change user conversation to."
    topic: Topic
  }

  type Query {
    "Get a broadcast by ID."
    broadcast(id: String!): Broadcast
    "Get all conversation triggers."
    conversationTriggers: [ConversationTrigger]
    "Get a topic by ID."
    topic(id: String!): Topic
    "Get all web signup confirmations."
    webSignupConfirmations: [WebSignupConfirmation]
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  AskSubscriptionStatusBroadcastTopic: {
    saidActiveTopic: (topic, args, context) =>
      Loader(context).topics.load(topic.saidActiveTopicId, context),
    saidLessTopic: (topic, args, context) =>
      Loader(context).topics.load(topic.saidLessTopicId, context),
  },
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
      if (broadcast.contentType === 'askSubscriptionStatus') {
        return 'AskSubscriptionStatusBroadcastTopic';
      }
      if (broadcast.contentType === 'askYesNo') {
        return 'AskYesNoBroadcastTopic';
      }
      if (broadcast.contentType === 'autoReplyBroadcast') {
        return 'AutoReplyBroadcast';
      }
      if (broadcast.contentType === 'photoPostBroadcast') {
        return 'PhotoPostBroadcast';
      }
      if (broadcast.contentType === 'textPostBroadcast') {
        return 'TextPostBroadcast';
      }
      if (broadcast.contentType === 'broadcast') {
        return 'LegacyBroadcast';
      }
      return null;
    },
  },
  ConversationTrigger: {
    topic: (conversationTrigger, args, context) => {
      const topicId = conversationTrigger.topicId;
      return topicId ? Loader(context).topics.load(topicId, context) : null;
    },
  },
  Query: {
    broadcast: (_, args, context) => Loader(context).broadcasts.load(args.id),
    conversationTriggers: (_, args, context) =>
      getConversationTriggers(args, context),
    topic: (_, args, context) => Loader(context).topics.load(args.id),
    webSignupConfirmations: (_, args, context) =>
      getWebSignupConfirmations(args, context),
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
      if (topic.contentType === 'askYesNo') {
        return 'AskYesNoBroadcastTopic';
      }
      if (topic.contentType === 'autoReply') {
        return topic.campaignId ? 'AutoReplySignupTopic' : 'AutoReplyTopic';
      }
      if (topic.contentType === 'photoPostConfig') {
        return 'PhotoPostTopic';
      }
      if (topic.contentType === 'textPostConfig') {
        return 'TextPostTopic';
      }
      return null;
    },
  },
  WebSignupConfirmation: {
    topic: (webSignupConfirmation, args, context) =>
      Loader(context).topics.load(webSignupConfirmation.topicId, context),
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
