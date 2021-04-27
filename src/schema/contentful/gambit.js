import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../../resolvers/contentful/gambit';

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
    askCaption: String @deprecated(reason: "Field no longer displayed or asked for in user flow.")
    "Template that asks user to resend a message with a valid photo caption."
    invalidCaption: String @deprecated(reason: "Field no longer displayed or asked for in user flow.")
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
    "The unique ID for this Contentful asset."
    id: String!
    "The URL where this broadcast media is available at."
    url: String!
    "Mime-type for this broadcast media asset."
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

  type Query {
    "Get a broadcast by ID."
    broadcast(id: String!): Broadcast
    "Get all conversation triggers."
    conversationTriggers: [ConversationTrigger]
    "Get a topic by ID."
    topic(id: String!): Topic
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
