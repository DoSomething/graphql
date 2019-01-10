import logger from 'heroku-logger';
import { assign } from 'lodash';

import config from '../../config';

const GAMBIT_CONTENT_URL = config('services.gambitContent.url');
// TODO: Add Northstar token support to Gambit Conversations, use helpers.authorizedRequest
const options = { headers: {} };
options.headers[config('services.gambitContent.authHeader')] = config(
  'services.gambitContent.apiKey',
);

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
const transformTopic = json => {
  const entry = json.data.raw;
  return assign(transformItem(entry), {
    campaignId: entry.fields.campaign
      ? entry.fields.campaign.fields.campaignId
      : null,
  });
};

/**
 * @param {Object} json
 * @return {Object}
 */
const transformBroadcast = json => {
  const entry = json.data.raw;
  return assign(transformItem(entry), { text: entry.fields.text });
};

/**
 * @param {String} id
 * @return {Object}
 */
const getContentfulEntryById = async id => {
  const response = await fetch(
    `${GAMBIT_CONTENT_URL}/v1/contentfulEntries/${id}`,
    options,
  );

  return response.json();
};

/**
 * Fetch a broadcast from Gambit by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getBroadcastById = async (id, context) => {
  logger.debug('Loading broadcast from Gambit Content', { id });

  try {
    const json = await getContentfulEntryById(id);
    return transformBroadcast(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load broadcast.', { id, error, context });
  }

  return null;
};

/**
 * Fetch a topic from Gambit by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getTopicById = async (id, context) => {
  logger.debug('Loading topic from Gambit Content', { id });

  try {
    const json = await getContentfulEntryById(id);
    return transformTopic(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load topic.', { id, error, context });
  }

  return null;
};

export default null;
