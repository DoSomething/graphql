/* Disabling this linting rule since we're conforming to an API. */
/* eslint-disable class-methods-use-this */

import { set } from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';

const HELP_TEXT =
  '**This field contains personally-identifiable information, and access will be logged.**';

class SensitiveFieldDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    set(field, 'isSensitive', true);
    set(field, 'description', `${field.description} ${HELP_TEXT}`);
  }
}

export default SensitiveFieldDirective;
