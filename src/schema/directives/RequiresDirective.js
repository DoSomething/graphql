import { SchemaDirectiveVisitor } from 'graphql-tools';

class RequiresDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.requiredHttpIncludes = this.args.fields;
  }
}

export default RequiresDirective;
