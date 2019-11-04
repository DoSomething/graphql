import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import { getSchoolById } from '../repositories/schools';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  "A school."
  type School {
    "The school ID."
    id: String!
    "The school name."
    name: String!
    "The school city."
    city: String
    "The school state."
    state: String
  }

  type Query {
    "Get a school by ID."
    school(id: String!): School
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    school: (_, args, context) => getSchoolById(args.id),
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
