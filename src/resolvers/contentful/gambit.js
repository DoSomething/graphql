import Loader from '../../loader';
import {
  getConversationTriggers,
  getWebSignupConfirmations,
  linkResolver,
} from '../../repositories/contentful/gambit';

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
    attachments: linkResolver,
    saidFirstChoiceTransition: linkResolver,
    saidSecondChoiceTransition: linkResolver,
    saidThirdChoiceTransition: linkResolver,
    saidFourthChoiceTransition: linkResolver,
    saidFifthChoiceTransition: linkResolver,
  },
  AskSubscriptionStatusBroadcastTopic: {
    attachments: linkResolver,
    saidActiveTransition: linkResolver,
    saidLessTransition: linkResolver,
  },
  AskVotingPlanStatusBroadcastTopic: {
    attachments: linkResolver,
    saidCantVoteTransition: linkResolver,
    saidNotVotingTransition: linkResolver,
    saidVotedTransition: linkResolver,
  },
  AskYesNoBroadcastTopic: {
    attachments: linkResolver,
    saidNoTransition: linkResolver,
    saidYesTransition: linkResolver,
  },
  AutoReplyBroadcast: {
    attachments: linkResolver,
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
    attachments: linkResolver,
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
    attachments: linkResolver,
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

export default resolvers;
