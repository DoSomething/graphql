import { URL, URLSearchParams } from 'url';
import {
  flatMap,
  map,
  mapKeys,
  has,
  camelCase,
  omit,
  isUndefined,
  isNil,
  zipObject,
} from 'lodash';

/**
 * Attach the user's authorization token to a request.
 *
 * @return {Object}
 */
export const authorizedRequest = context => {
  if (!context.authorization) {
    return { headers: { Accept: 'application/json' } };
  }

  return {
    headers: {
      Accept: 'application/json',
      Authorization: context.authorization,
      'Content-Type': 'application/json',
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

/**
 * Determine the fields that were requested for an item, via the query's
 * AST provided in the resolver's `info` argument. <dfurn.es/30usMgs>
 *
 * @param {GraphQLResolveInfo} info
 * @return {string[]}
 */
export const getSelection = info => info.fieldNodes[0].selectionSet.selections;

/**
 * Get a list of fields that we should query from the backend.
 *
 * @param {GraphQLResolveInfo} info
 * @return {string[]}
 */
export const queriedFields = info => {
  const type = info.schema.getType(info.returnType.name);
  const fields = type.getFields();

  return flatMap(getSelection(info), field => {
    const name = field.name.value;

    // Optionally, the `@requires` directive can be used to
    // specify a custom mapping of GraphQL->REST fields:
    return fields[name].requiredHttpIncludes || name;
  });
};

/**
 * Zip the provided list of fields & values, unless all the provided
 * values are `null` (in which case the item must have 404'd).
 *
 * @param {string[]} fields
 * @param {any[]} values
 */
export const zipUnlessEmpty = (fields, values) =>
  values.every(isNil) ? null : zipObject(fields, values);
