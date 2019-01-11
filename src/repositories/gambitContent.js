import { createClient } from 'contentful';
import logger from 'heroku-logger';
import { assign, map } from 'lodash';

import config from '../../config';

const client = createClient({
  space: config('services.gambitContent.spaceId'),
  accessToken: config('services.gambitContent.accessToken'),
});

/**
 * @param {Object} entry
 * @return {Object}
 */
const transformItem = entry => ({
  id: entry.sys.id,
  type: entry.sys.contentType.sys.id,
  createdAt: entry.sys.createdAt,
  updatedAt: entry.sys.updatedAt,
  name: entry.fields.name,
});

/**
 * @param {Object} json
 * @return {Object}
 */
const transformTopic = json =>
  assign(transformItem(json), {
    campaignId: json.fields.campaign
      ? json.fields.campaign.fields.campaignId
      : null,
  });

/**
 * @param {Object} json
 * @return {Object}
 */
const transformBroadcast = json =>
  assign(transformItem(json), { text: json.fields.text });

/**
 * Fetch a broadcast from Gambit Content by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getBroadcastById = async (id, context) => {
  logger.debug('Loading broadcast from Gambit Content', { id });

  try {
    const json = await client.getEntry(id);

    return transformBroadcast(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load broadcast.', { id, error, context });
  }

  return null;
};

/**
 * Fetch broadcasts from Gambit Content.
 *
 * @return {Array}
 */
export const getBroadcasts = async (args, context) => {
  logger.debug('Loading broadcasts from Gambit Content');

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

    return map(json.items, transformBroadcast);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load broadcasts.', { error, context });
  }

  return null;
};

/**
 * Fetch a topic from Gambit Content by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getTopicById = async (id, context) => {
  logger.debug('Loading topic from Gambit Content', { id });

  try {
    const json = await client.getEntry(id);

    return transformTopic(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load topic.', { id, error, context });
  }

  return null;
};

export default null;
