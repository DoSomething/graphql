import { map, mapKeys, camelCase, omit, isUndefined } from 'lodash';
import { URL, URLSearchParams } from 'url';

/**
 * Attach the user's authorization token to a request.
 *
 * @return {Object}
 */
export const authorizedRequest = context => {
  if (!context.authorization) {
    return { Accept: 'application/json' };
  }

  return {
    headers: {
      Accept: 'application/json',
      Authorization: context.authorization,
    },
  };
};

/**
 * Require an authorization token for this request.
 *
 * @return {Object}
 */
export const requireAuthorizedRequest = context => {
  if (!context.authorization) {
    throw new Error('An access token is required for this query/mutation.');
  }

  return authorizedRequest(context);
};

/**
 * Transform JSON data for GraphQL.
 *
 * @param {Object} data
 * @return {Object}
 */
export const transformResponse = data => {
  const result = mapKeys(data, (_, key) => camelCase(key));

  if (!result.id) {
    return null;
  }

  // Rename any instances of 'topic'.
  if (result.topic) {
    result.topicId = result.topic;
    delete result.topic;
  }

  // Rename any instances of 'northstar_id'.
  if (result.northstarId) {
    result.userId = result.northstarId;
    delete result.northstarId;
  }

  return result;
};

/**
 * Transform an individual item response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformItem = json => transformResponse(json.data);

/**
 * Transform a collection response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformCollection = json => map(json.data, transformResponse);

/**
 * Append a URL with optional query string arguments.
 *
 * @param {String} path
 * @param {Object} args
 * @return {String}
 */
export const urlWithQuery = (path, args) => {
  try {
    const url = new URL(path);

    // Replace existing query params with given arguments.
    url.search = new URLSearchParams(omit(args, isUndefined));

    return url.toString();
  } catch (exception) {
    // If we get mangled 'default' as URL, return null.
    return null;
  }
};
