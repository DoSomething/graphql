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
