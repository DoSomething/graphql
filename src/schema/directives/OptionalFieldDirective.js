import { SchemaDirectiveVisitor } from 'graphql-tools';

class SensitiveFieldDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.isOptional = true;
  }
}

export default SensitiveFieldDirective;
