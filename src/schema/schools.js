import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import { getSchoolById, searchSchools } from '../repositories/schools';

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
    city: String!
    "The school state."
    state: String!
  }

  type Query {
    "Get a school by ID."
    school(id: String!): School
    "Search schools by state and name."
    searchSchools(
      "The school state to filter by."
      state: String!
      "The school name to search for."
      name: String!
    ): [School]
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    school: (_, args) => getSchoolById(args.id),
    searchSchools: (_, args) => searchSchools(args.state, args.name),
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
