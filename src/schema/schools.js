import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/schools';

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
    name: String
    "The school city."
    city: String
    "The school state."
    state: String
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
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
