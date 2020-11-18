import logger from 'heroku-logger';
import { intersection, snakeCase } from 'lodash';

import schema from '../schema';
import config from '../../config';
import {
  querify,
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
    const url = `${NORTHSTAR_URL}/v2/users/${id}${querify({ include })}`;
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
    const url = `${NORTHSTAR_URL}/v2/users${querify({
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
 *
 * @param {String} id
 * @param {[EmailSubscriptionStatus]} emailSubscriptionStatus
 * @param {Boolean} subscribed
 * @param {Object} options
 */
export const updateEmailSubscriptionStatus = async (
  id,
  emailSubscriptionStatus,
  options,
) => {
  logger.debug('Updating email subscription status for user in Northstar', {
    id,
    emailSubscriptionStatus,
  });
  try {
    const response = await updateUser(
      id,
      {
        email_subscription_status: emailSubscriptionStatus,
      },
      options,
    );
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update email subscription status.', { id, error });
  }
  return null;
};
/**
 * Update a user's subscription status to a specific email newsletter.
 *
 * @param {String} id
 * @param {EmailSubscriptionTopic} topic
 * @param {Boolean} subscribed
 * @param {Object} options
 */
export const updateEmailSubscriptionTopic = async (
  id,
  topic,
  subscribed,
  options,
) => {
  logger.debug('Updating email subscription topic for user in Northstar', {
    id,
    topic,
    subscribed,
  });

  try {
    const response = await fetch(
      `${NORTHSTAR_URL}/v2/users/${id}/subscriptions/${topic.toLowerCase()}`,
      {
        method: subscribed ? 'POST' : 'DELETE',
        ...requireAuthorizedRequest(options),
      },
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update subscription status for topic.', {
      id,
      error,
    });
  }

  return null;
};

/**
 * Update a user's list of causes they are interested in.
 *
 * @param {String} id
 * @param {Cause} cause
 * @param {Boolean} interested
 * @param {Object} options
 */
export const updateCausePreferences = async (
  id,
  cause,
  interested,
  options,
) => {
  logger.debug('Updating cause for user in Northstar', {
    id,
    cause,
    interested,
  });

  try {
    const response = await fetch(
      `${NORTHSTAR_URL}/v2/users/${id}/causes/${cause.toLowerCase()}`,
      {
        method: interested ? 'POST' : 'DELETE',
        ...requireAuthorizedRequest(options),
      },
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update causes preferences for this cause.', {
      id,
      error,
    });
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
 * Update a user's club_id in Northstar.
 *
 * @param {String} id
 * @param {Int} clubId
 * @param {Object} options
 *
 * @return {Object}
 */
export const updateClubId = async (id, clubId, options) => {
  logger.debug('Updating club id for user in Northstar', {
    id,
  });

  try {
    const response = await updateUser(
      id,
      {
        club_id: clubId,
      },
      options,
    );

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to update club id.', { id, error });
  }

  return null;
};

/**
 * Create a new "deletion request" for the given user.
 *
 * @param {String} id
 * @param {Object} options
 */
export const requestDeletion = async (id, options) => {
  logger.debug('Requesting deletion for user', { id });

  try {
    const response = await fetch(`${NORTHSTAR_URL}/v2/users/${id}/deletion`, {
      method: 'POST',
      ...requireAuthorizedRequest(options),
    });

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to delete user.', { id, error });
  }

  return null;
};

/**
 * Undo a "deletion request" for the given user.
 *
 * @param {String} id
 * @param {Object} options
 */
export const undoDeletionRequest = async (id, options) => {
  logger.debug('Undoing deletion request for user', { id });

  try {
    const response = await fetch(`${NORTHSTAR_URL}/v2/users/${id}/deletion`, {
      method: 'DELETE',
      ...requireAuthorizedRequest(options),
    });

    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to undo deletetion request for user.', { id, error });
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
