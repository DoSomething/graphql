import { SchemaDirectiveVisitor } from 'graphql-tools';

const HELP_TEXT =
  '**This field contains personally-identifiable information, and access will be logged.**';

class SensitiveFieldDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.isSensitive = true;
    field.description = `${field.description} ${HELP_TEXT}`;
  }
}

export default SensitiveFieldDirective;
