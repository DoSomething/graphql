import { camelCase, has, map, mapKeys } from 'lodash';

/**
 * Transform JSON data for GraphQL.
 *
 * @param {Object} data
 * @return {Object}
 */
export const transformResponse = (data, idField = 'id') => {
  const result = mapKeys(data, (_, key) => camelCase(key));

  if (!has(result, idField)) {
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

  // Add a "deleted" field. Since this response didn't
  // 404, we can assume it hasn't been deleted:
  result.deleted = false;

  return result;
};

/**
 * Transform an individual item response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformItem = json => transformResponse(json.data, 'id');

/**
 * Transform a collection response.
 *
 * @param {Object} json
 * @return {Object}
 */
export const transformCollection = json =>
  map(json.data, data => transformResponse(data, 'id'));
