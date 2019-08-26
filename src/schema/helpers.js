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
 * Determine the requested fields for the object returned from the resolver,
 * via the AST provided in the resolver's `info` argument. <dfurn.es/30usMgs>
 *
 * @param {GraphQLResolveInfo} info
 * @return {String[]}
 */
export const fieldsToResolve = info =>
  info.fieldNodes[0].selectionSet.selections.map(field => field.name.value);
