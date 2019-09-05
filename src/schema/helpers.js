import { isNil, flatMap, zipObject, values } from 'lodash';

/**
 * Transform a string constant into a GraphQL-style enum.
 *
 * @param  {String} string
 * @return {String}
 */
export const stringToEnum = string => {
  if (!string) {
    return null;
  }

  return string.toUpperCase().replace('-', '_');
};

/**
 * Transform a list into a list of GraphQL-style enums.
 *
 * @param  {String} string
 * @return {String}
 */
export const listToEnums = list => {
  if (!list) {
    return null;
  }

  return list.map(stringToEnum);
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
 * Keep track of any `@sensitive` fields that must be specifically
 * queried using the `?include=` query string on our REST APIs.
 *
 * @param {GraphQLResolveInfo} info
 * @return {string[]}
 */
export const markSensitiveFieldsInContext = (info, context) => {
  if (!context.optionalFields) {
    context.optionalFields = {};
  }

  // If this is the first time we're resolving this type (e.g. User)
  // mark any `@sensitive` fields in the context for later:
  const type = info.schema.getType(info.returnType.name);
  if (!context.optionalFields[type]) {
    const fields = type.getFields();

    context.optionalFields[type] = values(fields)
      .filter(field => field.isSensitive)
      .map(field => field.name);
  }
};

/**
 * Zip the provided list of keys & entries, unless all the provided
 * values are `null` (in which case the item must have 404'd).
 *
 * @param {string[]} keys
 * @param {any[]} entries
 */
export const zipUnlessEmpty = (keys, entries) =>
  entries.every(isNil) ? null : zipObject(keys, entries);
