import logger from 'heroku-logger';

import config from '../../config';
import { transformItem, requireAuthorizedRequest } from './helpers';

const NORTHSTAR_URL = config('services.northstar.url');

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = async (id, options) => {
  logger.debug('Loading user from Northstar', { id });
  try {
    const response = await fetch(`${NORTHSTAR_URL}/v2/users/${id}`, options);
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load user.', { id, error, options });
  }

  return null;
};

/**
 * Toggle a reaction on Rogue.
 *
 * @param {Number} postId
 * @return {Object}
 */
export const updateEmailSubscriptionTopics = async (
  id,
  emailSubscriptionTopics,
  options,
) => {
  logger.debug('Updating email_subscription_topics for user in Northstar', {
    id,
  });

  var formattedTopics = emailSubscriptionTopics
    .toString()
    .toLowerCase()
    .split(',');

  // If no email topics were passed, send an empty array
  if (emailSubscriptionTopics.length < 1) {
    formattedTopics = [];
  }

  const body = { email_subscription_topics: formattedTopics };

  try {
    const response = await fetch(`${NORTHSTAR_URL}/v2/users/${id}`, {
      ...requireAuthorizedRequest(options),
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load user.', { id, error });
  }

  return null;
};

export default null;
