import { set } from 'lodash';
import { SchemaDirectiveVisitor } from 'graphql-tools';

class RequiresDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    set(field, 'requiredHttpIncludes', this.args.fields);
  }
}

export default RequiresDirective;
