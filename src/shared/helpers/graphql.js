import { values } from 'lodash';

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
