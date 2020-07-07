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

    # @FUTURE Example of other potential field and associated resolver.
    # searchPages: [Int]!
  }

  # type AlgoliaCollection {
  #   results: [Int]!
  # }

  type AlgoliaCollection {
    edges: [SearchEdge]
    pageInfo: PageInfo!
  }

  type SearchEdge {
    cursor: String!
    node: CampaignResult!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # @TEMP: used for testing but should eventually import/use the Campaign type.
  type CampaignResult {
    id: Int!
    internalTitle: String!
  }
`;

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
