import { createClient } from 'contentful';
import logger from 'heroku-logger';
import { assign, map } from 'lodash';

import config from '../../config';

const client = createClient({
  space: config('services.gambitContent.spaceId'),
  accessToken: config('services.gambitContent.accessToken'),
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
 * @return {String}
 */
const getChangeTopicId = json => {
  if (json.fields.topic) {
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
const getMessageText = json => json.fields.text;

/**
 * @param {Object} json
 * @return {Object}
 */
const getSummary = json => ({
  id: json.sys.id,
  type: getContentType(json),
  createdAt: json.sys.createdAt,
  updatedAt: json.sys.updatedAt,
  name: json.fields.name,
});

/**
 * @param {Object} json
 * @return {Object}
 */
const getFields = json => {
  const type = getContentType(json);
  const fields = json.fields;

  if (type === 'askYesNo') {
    return {
      text: getMessageText(json),
      saidNo: getMessageText(fields.noTransition),
      saidNoTopicId: getChangeTopicId(fields.noTransition),
      saidYes: getMessageText(fields.yesTransition),
      saidYesTopicId: getChangeTopicId(fields.yesTransition),
    };
  }

  if (type === 'autoReply') {
    return {
      autoReply: fields.autoReply,
      campaignId: getCampaignId(json),
    };
  }

  if (type === 'autoReplyBroadcast') {
    return {
      text: getMessageText(json),
      topicId: getChangeTopicId(json),
    };
  }

  if (type === 'photoPostBroadcast') {
    return {
      text: fields.text,
      topicId: getChangeTopicId(json),
    };
  }

  if (type === 'photoPostConfig') {
    return {
      askCaption: fields.askCaptionMessage,
      askPhoto: fields.askPhotoMessage,
      askQuantity: fields.askQuantityMessage,
      askWhyParticipated: fields.askWhyParticipatedMessage,
      campaignId: getCampaignId(json),
      completedPhotoPost: fields.completedMenuMessage,
      completedPhotoPostAutoReply: fields.invalidCompletedMenuCommandMessage,
      invalidCaption: fields.invalidCaptionMessage,
      invalidQuantity: fields.invalidQuantityMessage,
      invalidPhoto: fields.invalidPhotoMessage,
      invalidWhyParticipated: fields.invalidWhyParticipatedMessage,
      startPhotoPostAutoReply: fields.invalidSignupMenuCommandMessage,
    };
  }

  if (type === 'textPostBroadcast') {
    return {
      text: fields.text,
      topicId: getChangeTopicId(json),
    };
  }

  if (type === 'textPostConfig') {
    return {
      campaignId: getCampaignId(json),
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
    const json = await client.getEntry(id);

    return transformItem(json);
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
 * Fetch broadcasts from Gambit Content.
 *
 * @return {Array}
 */
export const getBroadcasts = async (args, context) => {
  logger.debug('Loading broadcasts from Gambit Contentful');

  const broadcastTypes = [
    'autoReplyBroadcast',
    'askSubscriptionStatus',
    'askVotingPlanStatus',
    'askYesNo',
    'photoPostBroadcast',
    'textPostBroadcast',
  ];

  try {
    const query = { order: '-sys.createdAt' };
    query['sys.contentType.sys.id[in]'] = broadcastTypes.join(',');

    const json = await client.getEntries(query);

    return map(json.items, transformItem);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load broadcasts.', { error, context });
  }

  return null;
};

export default null;
