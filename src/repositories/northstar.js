import { stringify } from 'qs';
import logger from 'heroku-logger';
import { intersection, snakeCase } from 'lodash';

import schema from '../schema';
import config from '../../config';
import {
  getOptional,
  transformItem,
  authorizedRequest,
  requireAuthorizedRequest,
  transformCollection,
} from './helpers';

const NORTHSTAR_URL = config('services.northstar.url');
const AURORA_URL = config('services.aurora.url');

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = async (id, fields, context) => {
  const optionalFields = intersection(fields, getOptional(schema, 'User'));

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
 * Fetch users from Northstar.
 *
 * @return {Object}
 */
export const getUsers = async (args, fields, context) => {
  const optionalFields = intersection(fields, getOptional(schema, 'User'));

  // Northstar expects a comma-separated list of snake_case fields.
  // If not querying anything, use 'undefined' to omit query string.
  const include = optionalFields.length
    ? optionalFields.map(snakeCase).join()
    : undefined;

  const search = args.search;

  logger.debug('Loading users from Northstar', { search, include });

  try {
    const url = `${NORTHSTAR_URL}/v2/users?${stringify({
      pagination: 'cursor',
      include,
      search,
    })}`;

    const response = await fetch(url, authorizedRequest(context));
    const json = await response.json();

    return transformCollection(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to search users.', { search, error });
  }

  return null;
};

/**
 * Update a Northstar user.
 *
 * @param {String} id
 * @param {Object} params
 * @param {Object} options
 *
 * @return {Promise}
 */
const updateUser = (id, params, options) => {
  return fetch(`${NORTHSTAR_URL}/v2/users/${id}`, {
    ...requireAuthorizedRequest(options),
    method: 'PUT',
    body: JSON.stringify(params),
  });
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

  try {
    const response = await updateUser(
      id,
      {
        email_subscription_topics: emailSubscriptionTopics.map(value =>
          value.toLowerCase(),
        ),
      },
      options,
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update email subscription topics.', { id, error });
  }

  return null;
};

/**
 * Update a user's school_id in Northstar.
 *
 * @param {String} id
 * @param {String} schoolId
 * @param {Object} options
 *
 * @return {Object}
 */
export const updateSchoolId = async (id, schoolId, options) => {
  logger.debug('Updating school_id for user in Northstar', {
    id,
  });

  try {
    const response = await updateUser(
      id,
      {
        school_id: schoolId,
      },
      options,
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update school id.', { id, error });
  }

  return null;
};

/**
 * Get Aurora profile permalink by ID.
 *
 * @param {String} id
 * @return {String}
 */
export const getPermalinkByUserId = id => `${AURORA_URL}/users/${id}`;
