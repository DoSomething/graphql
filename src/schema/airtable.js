import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/airtable';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  type Query {
    "Get voting information by location."
    locationVotingInformation(location: String!): LocationVotingInformation
  }

  "A set of voting information for a location."
  type LocationVotingInformation {
    "The unique ID for this location voting information."
    id: String!
    "The ISO-3166-2 location."
    location: String!
    "The deadline for voter registration."
    voterRegistrationDeadline: String
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
