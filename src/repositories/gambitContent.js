import { createClient } from 'contentful';
import redis from 'redis';
import Cacheman from 'cacheman';
import RedisEngine from 'cacheman-redis';
import logger from 'heroku-logger';
import { assign, map } from 'lodash';
import config from '../../config';

const contentfulClient = createClient({
  space: config('services.gambitContent.spaceId'),
  accessToken: config('services.gambitContent.accessToken'),
});

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = redis.createClient(config('cache.url'));
    redisClient.on('error', error => {
      logger.error('redisClient connection error', error);
      redisClient.quit();
      throw error;
    });

    redisClient.on('reconnecting', () => {
      logger.debug('redisClient is reconnecting');
    });
  }
  return redisClient;
};

const cache = new Cacheman(config('services.gambitContent.cache.name'), {
  ttl: config('services.gambitContent.cache.ttl'),
  engine: new RedisEngine(getRedisClient),
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
      invalidAskYesNoResponse: fields.invalidAskYesNoResponse,
      saidNo: getMessageText(fields.noTransition),
      saidNoTopicId: getChangeTopicId(fields.noTransition),
      saidYes: getMessageText(fields.yesTransition),
      saidYesTopicId: getChangeTopicId(fields.yesTransition),
      text: getMessageText(json),
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
    const cachedEntry = await cache.get(id);

    if (cachedEntry) {
      logger.debug('Cache hit for Gambit Contentful entry', { id });
      return cachedEntry;
    }

    logger.debug('Cache miss for Gambit Contentful entry', { id });

    const json = await contentfulClient.getEntry(id);
    const data = transformItem(json);
    await cache.set(id, data);

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

    const json = await contentfulClient.getEntries(query);

    return map(json.items, transformItem);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load broadcasts.', { error, context });
  }

  return null;
};

export default null;
