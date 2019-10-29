import { values } from 'lodash';
import { defaultFieldResolver } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { isListType } from 'graphql/type/definition';

class SensitiveFieldDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async (source, args, context, info) => {
      // If this is the first time this has run, initialize:
      if (!context.optionalFields) {
        context.optionalFields = {};
      }

      // Get the return type for this field:
      const returnType = isListType(info.returnType)
        ? info.returnType.ofType
        : info.returnType.name;

      const type = info.schema.getType(returnType);

      // If this is the first time we're resolving this type (e.g. User)
      // mark any `@sensitive` fields in the context for later:
      if (!context.optionalFields[type]) {
        context.optionalFields[type] = values(type.getFields())
          .filter(subfield => subfield.isOptional)
          .map(subfield => subfield.name);
      }

      return resolve.call(this, source, args, context, info);
    };
  }
}

export default SensitiveFieldDirective;
