import logger from 'heroku-logger';
import { map } from 'lodash';

import config from '../../config';
import { transformResponse } from './helpers';

const GAMBIT_URL = config('services.gambit.url');
const GAMBIT_AUTH = `${config('services.gambit.user')}:${config(
  'services.gambit.pass',
)}`;

const authorizedRequest = () => ({
  headers: {
    Accept: 'application/json',
    Authorization: `Basic ${Buffer.from(GAMBIT_AUTH).toString('base64')}`,
  },
});

/**
 * Transform an individual item response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformItem = json => transformResponse(json, 'id');

/**
 * Transform a collection response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformCollection = json => map(json, transformItem);

/**
 * @param {Number} page
 * @param {Number} count
 * @return {String}
 */
function getPaginationQueryString(page, count) {
  return `limit=${count}&skip=${(page - 1) * count}&sort=-createdAt`;
}

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
      `${GAMBIT_URL}/api/v1/conversations/${id}`,
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
 */
export const getConversations = async (args, context) => {
  const response = await fetch(
    `${GAMBIT_URL}/api/v1/conversations`,
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
    `${GAMBIT_URL}/api/v1/conversations?query={"userId":"${userId}"}&${getPaginationQueryString(
      args.page,
      args.count,
    )}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch a message from Gambit by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getMessageById = async (id, context) => {
  logger.debug('Loading message from Gambit', { id });

  try {
    const response = await fetch(
      `${GAMBIT_URL}/api/v1/messages/${id}`,
      authorizedRequest(context),
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load message.', { id, error, context });
  }

  return null;
};

/**
 * Fetch messages from Gambit.
 *
 * @return {Array}
 */
export const getMessages = async (args, context) => {
  logger.debug('Loading messages from Gambit');

  const response = await fetch(
    `${GAMBIT_URL}/api/v1/messages?${getPaginationQueryString(
      args.page,
      args.count,
    )}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch messages from Gambit by conversation ID.
 *
 * @param {String} id
 * @return {Array}
 */
export const getMessagesByConversationId = async (id, page, count, context) => {
  logger.debug('Loading messages from Gambit for Conversation', { id });

  const response = await fetch(
    `${GAMBIT_URL}/api/v1/messages?query={"conversationId":"${id}"}&${getPaginationQueryString(
      page,
      count,
    )}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

export default null;
