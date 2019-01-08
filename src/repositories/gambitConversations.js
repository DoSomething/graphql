import logger from 'heroku-logger';
import { map } from 'lodash';

import config from '../../config';

// TODO: Add Northstar token support to Gambit Conversations, and filter data by role.
const authorizedRequest = () => {
  'application/json';
};

const GAMBIT_CONVERSATIONS_URL = config('services.gambitConversations.url');

/**
 * Transform JSON data for GraphQL.
 *
 * @param {Object} data
 * @return {Object}
 */
const transformResponse = data => {
  const result = data;

  // Rename Mongo identifier '_id' as id.
  /* eslint-disable no-underscore-dangle */
  const id = result._id;
  if (!id) {
    return null;
  }
  result.id = id;
  delete result._id;
  /* eslint-enable no-underscore-dangle */

  return result;
};

/**
 * Transform an individual item response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformItem = json => transformResponse(json);

/**
 * Transform a collection response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformCollection = json => map(json, transformResponse);

/**
 * Fetch a conversation from Gambit by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getConversationById = async (id, context) => {
  logger.debug('Loading conversation from Gambit', { id });
  try {
    const response = await fetch(
      `${GAMBIT_CONVERSATIONS_URL}/api/v1/conversations/${id}`,
      authorizedRequest(context),
    );
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load conversation.', { id, error, context });
  }

  return null;
};

/**
 * Fetch conversations from Gambit.
 *
 * @param {String} id
 * @param {Number} count
 * @param {Number} page
 * @param {String} orderBy
 * @return {Array}
 * @return {Array}
 */
export const getConversations = async (args, context) => {
  const response = await fetch(
    `${GAMBIT_CONVERSATIONS_URL}/api/v1/conversations`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch conversations from Gambit by user ID.
 *
 * @param {String} id
 * @return {Array}
 */
export const getConversationsByUserId = async (args, context) => {
  const userId = args.id;
  logger.debug('Loading user conversations from Gambit', { id: userId });

  const response = await fetch(
    `${GAMBIT_CONVERSATIONS_URL}/api/v1/conversations?query={"userId":"${
      userId
    }"}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

export default null;
