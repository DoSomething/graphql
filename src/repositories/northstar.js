import { stringify } from 'qs';
import logger from 'heroku-logger';
import { intersection, snakeCase } from 'lodash';

import Loader from '../loader';
import config from '../../config';
import {
  transformItem,
  queriedFields,
  zipUnlessEmpty,
  authorizedRequest,
  requireAuthorizedRequest,
  markSensitiveFieldsInContext,
} from './helpers';

const NORTHSTAR_URL = config('services.northstar.url');

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = async (id, fields, context) => {
  const optionalFields = intersection(fields, context.optionalFields.User);

  // Northstar expects a comma-separated list of snake_case fields.
  // If not querying anything, use 'undefined' to omit query string.
  const include = optionalFields.length
    ? optionalFields.map(snakeCase).join()
    : undefined;

  logger.debug('Loading user from Northstar', { id, include });

  try {
    const url = `${NORTHSTAR_URL}/v2/users/${id}?${stringify({ include })}`;
    const response = await fetch(url, authorizedRequest(context));

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load user.', { id, error });
  }

  return null;
};

/**
 * Fetch users from Northstar by IDs.
 *
 * @return {Object}
 */
export const usersResolver = async (_, { id }, context, info) => {
  markSensitiveFieldsInContext(info, context);

  const fields = queriedFields(info);

  return Loader(context)
    .users.load(id)
    .then(user => user.loadMany(fields))
    .then(values => zipUnlessEmpty(fields, values));
};

/**
 * Update a user's email_subscription_topics in Northstar.
 *
 * @param {String} id
 * @param {[EmailSubscriptionTopic]} emailSubscriptionTopics
 * @param {Object} options
 *
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

  const formattedTopics = emailSubscriptionTopics.map(value =>
    value.toLowerCase(),
  );

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
    logger.warn('Unable to update email subscription topics.', { id, error });
  }

  return null;
};

export default null;
