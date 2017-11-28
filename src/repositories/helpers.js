import { map, mapKeys, camelCase } from 'lodash';

/**
 * ...
 *
 * @return {Object}
 */
export const authorizedRequest = (context) => {
  if (! context.authorization) {
    return {};
  }

  return {
    headers: {
      'Authorization': context.authorization
    },
  }
}

/**
 * Transform JSON data for GraphQL.
 *
 * @param {Object} data
 * @return {Object}
 */
const transformResponse = (data) => {
  return mapKeys(data, (_, key) => camelCase(key));
};

/**
 * Transform an individual item response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformItem = (json) => {
  return transformResponse(json.data);
};

/**
 * Transform a collection response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformCollection = (json) => {
  return map(json.data, transformResponse);
};
