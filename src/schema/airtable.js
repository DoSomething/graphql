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
    "The unique ID of this location voting information record."
    id: String!
    "The ISO-3166-2 location this voting information is for."
    location: String!
    "The deadline for voter registration, e.g. 10/31"
    voterRegistrationDeadline: String
    "The start date for early voting, e.g. 10/5"
    earlyVotingStarts: String
    "The end date for early voting, e.g. 10/20"
    earlyVotingEnds: String
    "The deadline for requesting an absentee ballot, e.g. 9/14"
    absenteeBallotRequestDeadline: String
    "The deadline for returning an absentee ballot, e.g. 9/27"
    absenteeBallotReturnDeadline: String
    "The type of deadline for returning an absentee ballot, e.g. received by, postmarked by"
    absenteeBallotReturnDeadlineType: String
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
