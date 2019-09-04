import { isNil, flatMap, zipObject } from 'lodash';

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

  const type = info.schema.getType(info.returnType.name);
  if (!context.optionalFields[type]) {
    const fields = type.getFields();

    context.optionalFields[type] = getSelection(info)
      .map(field => field.name.value)
      .filter(field => fields[field].isSensitive);
  }
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
