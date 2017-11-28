import { makeExecutableSchema } from 'graphql-tools';
import { getUserById } from '../repositories/northstar';
import gql from 'tagged-template-noop';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  # The user's role defines their abilities on any DoSomething.org site.
  enum Role {
    USER,
    STAFF,
    ADMIN
  }

  # A DoSomething.org user profile.
  type User {
    # The user's Northstar ID.
    id: String!
    # The user's first name.
    firstName: String
    # The user's last name. Null if unauthorized.
    lastName: String
    # The user's ISO-3166  country code.
    country: String,
    # The user's role.
    role: Role,
  }

  type Query {
    user(id: String!): User
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  User: {
    role: (user) => user.role.toUpperCase(),
  },
  Query: {
		user: (_, args, context) => getUserById(args.id, context),
	},
};

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
