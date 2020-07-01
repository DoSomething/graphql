import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/algolia';

const typeDefs = gql`
  type Query {
    # searchCampaigns: [Int]!

    searchCampaigns(
      term: String
      isOpen: Boolean
      perPage: Int
      cursor: String
    ): AlgoliaCollection!

    # searchPages: [Int]!
  }

  type AlgoliaCollection {
    results: [Int]!
  }

  # type AlgoliaCollection {
  #   edges: [SearchEdge]
  #   pageInfo: PageInfo!
  # }

  type SearchEdge {
    cursor: String!
    node: Int!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
`;

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});

// {
//   hits: [...],
//   nbHits: 183,
//   page: 0,
//   nbPages: 10,
//   hitsPerPage: 20,
//   exhaustiveNbHits: true,
//   query: '',
//   params: '',
//   processingTimeMS: 1
// }
