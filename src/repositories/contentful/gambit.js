import { createClient } from 'contentful';
import { assign, map } from 'lodash';
import logger from 'heroku-logger';

import config from '../../../config';
import Cache from '../../cache';

const cache = new Cache(config('services.contentful.gambit.cache'));

const contentfulClient = createClient({
  space: config('services.contentful.gambit.spaceId'),
  accessToken: config('services.contentful.gambit.accessToken'),
});

/**
 * @param {Object} json
 * @return {Number}
 */
const getCampaignId = json => {
  if (json.fields.campaign) {
    return json.fields.campaign.fields.campaignId;
  }
  return null;
};

/**
 * @param {Object} json
 * @return {Number}
 */
const getActionId = json => json.fields.actionId;

/**
 * @param {Object} json
 * @return {String}
 */
const getChangeTopicId = json => {
  if (json && json.fields.topic) {
    return json.fields.topic.sys.id;
  }
  return null;
};

/**
 * @param {Object} json
 * @return {String}
 */
const getContentType = json => json.sys.contentType.sys.id;

/**
 * @param {Object} json
 * @return {String}
 */
const getMessageText = json => {
  if (json && json.fields) {
    return json.fields.text;
  }
  return null;
};

/**
 * @param {Object} json
 * @return {Array}
 */
const getMessageAttachments = json => {
  if (!json.fields.attachments) {
    return [];
  }
  return json.fields.attachments.map(attachment => ({
    url: attachment.fields.file.url,
    contentType: attachment.fields.file.contentType,
  }));
};

/**
 * @param {Object} json
 * @return {Object}
 */
const getSummary = json => ({
  id: json.sys.id,
  contentType: getContentType(json),
  createdAt: json.sys.createdAt,
  updatedAt: json.sys.updatedAt,
  name: json.fields.name,
});

/**
 * @param {Object} json
 * @return {Object}
 */
const getFields = json => {
  const contentType = getContentType(json);
  const fields = json.fields;

  if (contentType === 'askMultipleChoice') {
    return {
      attachments: getMessageAttachments(json),
      invalidAskMultipleChoiceResponse: fields.invalidAskMultipleChoiceResponse,
      saidFirstChoice: getMessageText(fields.firstChoiceTransition),
      saidFirstChoiceTopicId: getChangeTopicId(fields.firstChoiceTransition),
      saidSecondChoice: getMessageText(fields.secondChoiceTransition),
      saidSecondChoiceTopicId: getChangeTopicId(fields.secondChoiceTransition),
      saidThirdChoice: getMessageText(fields.thirdChoiceTransition),
      saidThirdChoiceTopicId: getChangeTopicId(fields.thirdChoiceTransition),
      saidFourthChoice: getMessageText(fields.fourthChoiceTransition),
      saidFourthChoiceTopicId: getChangeTopicId(fields.fourthChoiceTransition),
      saidFifthChoice: getMessageText(fields.fifthChoiceTransition),
      saidFifthChoiceTopicId: getChangeTopicId(fields.fifthChoiceTransition),
      text: getMessageText(json),
    };
  }

  if (contentType === 'askSubscriptionStatus') {
    return {
      attachments: getMessageAttachments(json),
      invalidAskSubscriptionStatusResponse:
        fields.invalidAskSubscriptionStatusResponse,
      saidActive: getMessageText(fields.activeTransition),
      saidActiveTopicId: getChangeTopicId(fields.activeTransition),
      saidLess: getMessageText(fields.lessTransition),
      saidLessTopicId: getChangeTopicId(fields.lessTransition),
      saidNeedMoreInfo: fields.needMoreInfo,
      text: getMessageText(json),
    };
  }

  if (contentType === 'askVotingPlanStatus') {
    return {
      attachments: getMessageAttachments(json),
      saidCantVote: getMessageText(fields.cantVoteTransition),
      saidCantVoteTopicId: getChangeTopicId(fields.cantVoteTransition),
      saidNotVoting: getMessageText(fields.notVotingTransition),
      saidNotVotingTopicId: getChangeTopicId(fields.notVotingTransition),
      saidVoted: getMessageText(fields.votedTransition),
      saidVotedTopicId: getChangeTopicId(fields.votedTransition),
      text: getMessageText(json),
    };
  }

  if (contentType === 'askYesNo') {
    return {
      attachments: getMessageAttachments(json),
      invalidAskYesNoResponse: fields.invalidAskYesNoResponse,
      saidNo: getMessageText(fields.noTransition),
      saidNoTopicId: getChangeTopicId(fields.noTransition),
      saidYes: getMessageText(fields.yesTransition),
      saidYesTopicId: getChangeTopicId(fields.yesTransition),
      text: getMessageText(json),
    };
  }

  if (contentType === 'autoReply') {
    return {
      autoReply: fields.autoReply,
      campaignId: getCampaignId(json),
    };
  }

  if (contentType === 'autoReplyBroadcast') {
    return {
      attachments: getMessageAttachments(json),
      text: getMessageText(json),
      topicId: getChangeTopicId(json),
    };
  }

  if (contentType === 'campaign') {
    return {
      campaignId: fields.campaignId,
      text: getMessageText(json.fields.webSignup),
      topicId: getChangeTopicId(json.fields.webSignup),
    };
  }

  if (contentType === 'defaultTopicTrigger') {
    // The askMultipleChoice broadcast id is the topic we want to switch the member to
    const multipleChoiceTopicId =
      getContentType(fields.response) === 'askMultipleChoice'
        ? fields.response.sys.id
        : null;
    const changeTopicId = fields.response.fields.topic
      ? fields.response.fields.topic.sys.id
      : null;

    return {
      trigger: fields.trigger,
      reply: fields.response.fields.text,
      topicId: multipleChoiceTopicId || changeTopicId,
    };
  }

  if (contentType === 'photoPostBroadcast') {
    return {
      attachments: getMessageAttachments(json),
      text: fields.text,
      topicId: getChangeTopicId(json),
    };
  }

  if (contentType === 'photoPostConfig') {
    return {
      askCaption:
        fields.askCaptionMessage ||
        'Got it! Now text back a caption for your photo (think Instagram)! Keep it short & sweet, under 60 characters please.',
      askPhoto: fields.askPhotoMessage,
      askQuantity: fields.askQuantityMessage,
      askWhyParticipated: fields.askWhyParticipatedMessage,
      campaignId: getCampaignId(json),
      actionId: getActionId(json),
      completedPhotoPost: fields.completedMenuMessage,
      completedPhotoPostAutoReply: fields.invalidCompletedMenuCommandMessage,
      invalidCaption:
        fields.invalidCaptionMessage ||
        "Sorry, I didn't get that. Text Q if you have a question.\n\nText back a caption for your photo -- keep it short & sweet, under 60 characters please. (but more than 3!)",
      invalidQuantity: fields.invalidQuantityMessage,
      invalidPhoto: fields.invalidPhotoMessage,
      invalidWhyParticipated: fields.invalidWhyParticipatedMessage,
      startPhotoPostAutoReply: fields.invalidSignupMenuCommandMessage,
    };
  }

  if (contentType === 'textPostBroadcast') {
    return {
      attachments: getMessageAttachments(json),
      text: fields.text,
      topicId: getChangeTopicId(json),
    };
  }

  if (contentType === 'textPostConfig') {
    return {
      campaignId: getCampaignId(json),
      actionId: getActionId(json),
      completedTextPost: fields.completedTextPostMessage,
      invalidText: fields.invalidTextMessage,
    };
  }

  return null;
};

/**
 * @param {Object} json
 * @return {Object}
 */
const transformItem = json => assign(getSummary(json), getFields(json));

/**
 * Fetch a Gambit Contentful entry by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getGambitContentfulEntryById = async (id, context) => {
  logger.debug('Loading Gambit Contentful entry', { id });

  try {
    const cachedEntry = await cache.get(id);

    if (cachedEntry) {
      logger.debug('Cache hit for Gambit Contentful entry', { id });
      return cachedEntry;
    }

    logger.debug('Cache miss for Gambit Contentful entry', { id });

    const json = await contentfulClient.getEntry(id);
    const data = transformItem(json);
    cache.set(id, data);

    return data;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load Gambit Contentful entry.', {
      id,
      error,
      context,
    });
  }

  return null;
};

/**
 * Fetch all conversation triggers from the Gambit Contentful space.
 *
 * @return {Array}
 */
export const getConversationTriggers = async () => {
  const ALL_TRIGGERS_KEY = 'conversationTriggers';

  const cachedTriggers = await cache.get(ALL_TRIGGERS_KEY);
  if (cachedTriggers) {
    logger.debug('Cache hit for conversation triggers');
    return cachedTriggers;
  }

  logger.debug('Cache miss for conversation triggers');

  const query = {
    order: '-sys.createdAt',
    limit: 250,
    content_type: 'defaultTopicTrigger',
  };

  const json = await contentfulClient.getEntries(query);
  const data = map(json.items, transformItem);
  cache.set(ALL_TRIGGERS_KEY, data);

  return data;
};

/**
 * Fetch all web signup confirmations from the Gambit Contentful space.
 *
 * @return {Array}
 */
export const getWebSignupConfirmations = async () => {
  const ALL_CONFIRMATIONS_KEY = 'webSignupConfirmations';

  const cachedConfirmations = await cache.get(ALL_CONFIRMATIONS_KEY);
  if (cachedConfirmations) {
    logger.debug('Cache hit for web signup confirmations');
    return cachedConfirmations;
  }

  logger.debug('Cache miss for web signup confirmations');

  const query = {
    order: '-sys.createdAt',
    limit: 250,
    content_type: 'campaign',
  };
  query['fields.webSignup[exists]'] = true;

  const json = await contentfulClient.getEntries(query);

  const data = map(json.items, transformItem);
  cache.set(ALL_CONFIRMATIONS_KEY, data);

  return data;
};

export default null;
