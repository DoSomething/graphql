import { SchemaDirectiveVisitor } from 'graphql-tools';

class OptionalFieldDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.isOptional = true;
  }
}

export default OptionalFieldDirective;
