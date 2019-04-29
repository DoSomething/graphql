import { makeExecutableSchema } from 'graphql-tools';
import { gql } from 'apollo-server';

import {
  getConversationTriggers,
  getWebSignupConfirmations,
  linkResolver,
} from '../../repositories/contentful/gambit';

import Loader from '../../loader';

// Start shared fields ---

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
  text: String!
  "Broadcast message attachments to send."
  attachments: [BroadcastMedia]
`;

/**
 * TODO: should actionId be required? If so, we need to figure out backward compatibility
 * with legacy campaign action topics.
 */
const actionIdField = `
  "Used by Rogue to attribute this post to an specific action within the campaign"
  actionId: Int
`;

// --- End shared fields

// Start Interfaces ---

const topicInterface = `
  "A DoSomething.org conversation topic."
  interface Topic {
    ${entryFields}
  }
`;

const broadcastInterface = `
  "A DoSomething.org broadcast."
  interface Broadcast {
    ${broadcastFields}
  }
`;

// --- End Interfaces

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  ${topicInterface}
  ${broadcastInterface}

  type LegacyCampaign {
    campaignId: Int
    webSignup: Topic
  }

  "Transition topic for autoReply broadcasts"
  type AutoReplyTransition implements Topic {
    ${entryFields}
    "The transition text"
    text: String!
    "The autoReply Topic to switch the member to"
    topic: AutoReplyTopic!
  }

  "Topic for sending a single auto-reply message. If there is a campaign set, we sign up the member to that campaign"
  type AutoReplyTopic implements Topic {
    ${entryFields}
    "The auto reply text."
    autoReply: String
    "The campaign to switch the member to if this is a signup auto reply topic"
    legacyCampaign: LegacyCampaign
  }

  "FAQ topic"
  type FaqAnswerTopic implements Topic {
    ${entryFields}
    "The answer to the FAQ"
    text: String!
  }

  "Transition topic for photoPosts"
  type PhotoPostTransition implements Topic {
    ${entryFields}
    "The transition text"
    text: String!
    "The photoPostTopic to switch the member to"
    topic: PhotoPostTopic!
  }

  "Topic for creating signup and photo posts. Asks user to reply with START to create a draft photo post."
  type PhotoPostTopic implements Topic {
    ${entryFields}
    ${actionIdField}
    legacyCampaign: LegacyCampaign
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

  "Transition topic for textPosts"
  type TextPostTransition implements Topic {
    ${entryFields}
    "The transition text"
    text: String!
    "The transition Topic"
    topic: TextPostTopic!
  }

  "Topic for creating signup and text posts. Ask user to reply with a text post."
  type TextPostTopic implements Topic {
    ${entryFields}
    ${actionIdField}
    legacyCampaign: LegacyCampaign
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

  "Broadcast that asks user a multiple choice question, and changes topic to its own ID."
  type AskMultipleChoiceBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "The topic to change conversation to if user selects the first option."
    saidFirstChoiceTransition: Topic
    "The topic to change conversation to if user selects the second option."
    saidSecondChoiceTransition: Topic
    "The topic to change conversation to if user selects the third option."
    saidThirdChoiceTransition: Topic
    "The topic to change conversation to if user selects the fourth option."
    saidFourthChoiceTransition: Topic
    "The topic to change conversation to if user selects the fifth option."
    saidFifthChoiceTransition: Topic
    "Message sent until user responds with a valid multiple choice option."
    invalidAskMultipleChoiceResponse: String!
  }

  "Broadcast that asks user for smsStatus and changes topic to its own ID."
  type AskSubscriptionStatusBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "The topic to change conversation to if user says active."
    saidActiveTransition: AutoReplyTransition
    "The topic to change conversation to if user says less."
    saidLessTransition: AutoReplyTransition
    "Message sent if user says they need more info."
    saidNeedMoreInfo: String!
    "Message sent until user responds with a valid subscription status."
    invalidAskSubscriptionStatusResponse: String!
  }

  "Broadcast that asks user for votingPlanStatus and changes topic to its own ID."
  type AskVotingPlanStatusBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "The topic to change conversation to if user says they can't vote."
    saidCantVoteTransition: Topic
    "The topic to change conversation to if user says they aren't voting."
    saidNotVotingTransition: Topic
    "The topic to change conversation to if user says they already voted."
    saidVotedTransition: Topic
  }

  "Broadcast that asks user a yes or no question, and changes topic to its own ID."
  type AskYesNoBroadcastTopic implements Broadcast & Topic {
    ${broadcastFields}
    "The topic to change conversation to if user says yes."
    saidYesTransition: Topic
    "The topic to change conversation to if user says no."
    saidNoTransition: Topic
    "Message sent until user responds with yes or no."
    invalidAskYesNoResponse: String!
  }

  "Broadcast that changes topic to an AutoReplyTopic."
  type AutoReplyBroadcast implements Broadcast {
    ${broadcastFields}
    "The AutoReplyTopic to change conversation to."
    topic: AutoReplyTopic
  }

  "Broadcast that asks user to reply with START and changes topic to a PhotoPostTopic."
  type PhotoPostBroadcast implements Broadcast {
    ${broadcastFields}
    "The PhotoPostTopic to change conversation to."
    topic: PhotoPostTopic
  }

  "Broadcast that asks user to reply with a text post and changes topic to a TextPostTopic."
  type TextPostBroadcast implements Broadcast {
    ${broadcastFields}
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
    "The transition to change user conversation to."
    response: Topic!
  }

  "Confirmation to send a user when they sign up for a campaign from web."
  type WebSignupConfirmation {
    "The entry id"
    id: String!
    "The campaign ID that the user signed up for."
    campaignId: Int!
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
  AutoReplyTopic: {
    legacyCampaign: linkResolver,
  },
  AutoReplyTransition: {
    topic: linkResolver,
  },
  AskMultipleChoiceBroadcastTopic: {
    saidFirstChoiceTransition: linkResolver,
    saidSecondChoiceTransition: linkResolver,
    saidThirdChoiceTransition: linkResolver,
    saidFourthChoiceTransition: linkResolver,
    saidFifthChoiceTransition: linkResolver,
  },
  AskSubscriptionStatusBroadcastTopic: {
    saidActiveTransition: linkResolver,
    saidLessTransition: linkResolver,
  },
  AskVotingPlanStatusBroadcastTopic: {
    saidCantVoteTransition: linkResolver,
    saidNotVotingTransition: linkResolver,
    saidVotedTransition: linkResolver,
  },
  AskYesNoBroadcastTopic: {
    saidNoTransition: linkResolver,
    saidYesTransition: linkResolver,
  },
  AutoReplyBroadcast: {
    topic: linkResolver,
  },
  Broadcast: {
    __resolveType(broadcast) {
      if (broadcast.contentType === 'askMultipleChoice') {
        return 'AskMultipleChoiceBroadcastTopic';
      }
      if (broadcast.contentType === 'askSubscriptionStatus') {
        return 'AskSubscriptionStatusBroadcastTopic';
      }
      if (broadcast.contentType === 'askVotingPlanStatus') {
        return 'AskVotingPlanStatusBroadcastTopic';
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
  LegacyCampaign: {
    webSignup: linkResolver,
  },
  ConversationTrigger: {
    response: linkResolver,
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
    topic: linkResolver,
  },
  PhotoPostTransition: {
    topic: linkResolver,
  },
  PhotoPostTopic: {
    legacyCampaign: linkResolver,
  },
  TextPostTransition: {
    topic: linkResolver,
  },
  TextPostTopic: {
    legacyCampaign: linkResolver,
  },
  TextPostBroadcast: {
    topic: linkResolver,
  },
  Topic: {
    __resolveType(topic) {
      if (topic.contentType === 'autoReplyTransition') {
        return 'AutoReplyTransition';
      }
      if (topic.contentType === 'askMultipleChoice') {
        return 'AskMultipleChoiceBroadcastTopic';
      }
      if (topic.contentType === 'askSubscriptionStatus') {
        return 'AskSubscriptionStatusBroadcastTopic';
      }
      if (topic.contentType === 'askVotingPlanStatus') {
        return 'AskVotingPlanStatusBroadcastTopic';
      }
      if (topic.contentType === 'askYesNo') {
        return 'AskYesNoBroadcastTopic';
      }
      if (topic.contentType === 'autoReply') {
        return 'AutoReplyTopic';
      }
      if (topic.contentType === 'faqAnswer') {
        return 'FaqAnswerTopic';
      }
      if (topic.contentType === 'photoPostConfig') {
        return 'PhotoPostTopic';
      }
      if (topic.contentType === 'textPostConfig') {
        return 'TextPostTopic';
      }
      if (topic.contentType === 'photoPostTransition') {
        return 'PhotoPostTransition';
      }
      if (topic.contentType === 'textPostTransition') {
        return 'TextPostTransition';
      }
      return null;
    },
  },
  WebSignupConfirmation: {
    topic: linkResolver,
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
