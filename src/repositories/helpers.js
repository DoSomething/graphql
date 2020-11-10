import { URL, URLSearchParams } from 'url';
import {
  map,
  mapKeys,
  has,
  camelCase,
  snakeCase,
  omit,
  isUndefined,
  values,
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
 * Does this GraphQL AST node have the given directive?
 * @param {*} node
 * @param {String} name
 */
const hasDirective = (node, name) =>
  node.directives.some(directive => directive.name.value === name);

/**
 * Get the list of fields marked as '@optional' for the given type.
 *
 * @param {String} type
 * @return {String[]}
 */
export const getOptional = (schema, type) => {
  return values(schema.getType(type).getFields())
    .map(subfield => subfield.astNode)
    .filter(astNode => hasDirective(astNode, 'optional'))
    .map(astNode => astNode.name.value);
};

/**
 * Transform a list of GraphQL schema fields into the expected format for Northstar.
 *
 * @param {Array} fields
 * @return {String}
 */
export const transformFieldsForNorthstar = fields => {
  return (
    fields
      // Northstar expects a comma-separated list of snake_case fields.
      .map(snakeCase)
      .map(field =>
        // E.g. "addr_str_1" -> "addr_str1".
        // Our convention in Northstar is to suffix the number directly, without an underscore.
        field.replace(/_\d$/, field.substr(-1)),
      )
      .join()
  );
};
