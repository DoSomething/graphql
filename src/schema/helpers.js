import { snakeCase, kebabCase } from 'lodash';

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

  return snakeCase(string).toUpperCase();
};

/**
 * Transform a list into a list of GraphQL-style enums.
 *
 * @param  {String} string
 * @return {String}
 */
export const listToEnums = list => {
  if (!list) {
    return [];
  }

  // adding a check for an edge case where our users causes are stored as an object `{0: "animal_welfare", 1: "bullying"}` instead of an array
  // graphql is expecting an array, so we need to update the causes object in that case
  // a [longer term fix](https://www.pivotaltracker.com/story/show/172005082) is in the works for this 
  if (!Array.isArray(list)) {
    list = Object.values(list);
  }

  return list.map(stringToEnum);
};

/**
 * Transform a GraphQL-style enum into a kebab-case string.
 *
 * @param  {String} enumArg
 * @return {String}
 */
export const enumToString = enumArg => {
  if (!enumArg) {
    return null;
  }

  return kebabCase(enumArg);
};
