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

// {
//   hits: [],
//   nbHits: 183,
//   page: 0,
//   nbPages: 10,
//   hitsPerPage: 20,
//   exhaustiveNbHits: true,
//   query: '',
//   params: '',
//   processingTimeMS: 1
// }
