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
  engine: new RedisEngine(getRedisClient()),
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

  if (contentType === 'askYesNo') {
    return {
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
      text: getMessageText(json),
      topicId: getChangeTopicId(json),
    };
  }

  if (contentType === 'defaultTopicTrigger') {
    return {
      trigger: fields.trigger,
      reply: fields.response.fields.text,
      topicId: fields.response.fields.topic
        ? fields.response.fields.topic.sys.id
        : null,
    };
  }

  if (contentType === 'photoPostBroadcast') {
    return {
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
      text: fields.text,
      topicId: getChangeTopicId(json),
    };
  }

  if (contentType === 'textPostConfig') {
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
 * Fetch all conversation triggers from Gambit Content.
 *
 * @return {Array}
 */
export const getConversationTriggers = async () => {
  const query = { order: '-sys.createdAt' };
  query['sys.contentType.sys.id'] = 'defaultTopicTrigger';

  const json = await contentfulClient.getEntries(query);
  // For now, ignore redirects - let's refactor this in Contentful.
  const items = json.items.filter(
    item => getContentType(item.fields.response) !== 'defaultTopicTrigger',
  );

  return map(items, transformItem);
};

export default null;
