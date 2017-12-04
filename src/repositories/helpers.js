import { map, mapKeys, camelCase } from 'lodash';

/**
 * Attach the user's authorization token to a request.
 *
 * @return {Object}
 */
export const authorizedRequest = context => {
  if (!context.authorization) {
    return {};
  }

  return {
    headers: {
      Authorization: context.authorization,
    },
  };
};

/**
 * Transform JSON data for GraphQL.
 *
 * @param {Object} data
 * @return {Object}
 */
const transformResponse = data => mapKeys(data, (_, key) => camelCase(key));

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
