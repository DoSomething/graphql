import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/algolia';

const typeDefs = gql`
  type Query {
    searchCampaigns: [Int]!
  }
`;

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
