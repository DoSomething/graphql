import { getFields } from 'fielddataloader';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    user: async (_, { id }, context, info) => {
      const { dataSources } = context;

      return dataSources.usersApi.getUserById(id, getFields(info), context);
    },
  },
};

export default resolvers;
