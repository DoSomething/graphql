import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/algolia';

const typeDefs = gql`
  type Query {
    searchCampaigns(
      term: String
      isOpen: Boolean
      perPage: Int
      cursor: String
    ): AlgoliaCampaignCollection!

    # @TODO: Example future type for searching pages.
    # searchPages: (
    #   term: String
    #   isOpen: Boolean
    #   perPage: Int
    #   cursor: String
    # ): AlgoliaPageCollection!
  }

  type AlgoliaCampaignCollection {
    edges: [CampaignSearchEdge]
    pageInfo: PageInfo!
  }

  # @TODO: Example future page collection type.
  # type AlgoliaPageCollection {
  #   edges: [PageSearchEdge]
  #   pageInfo: PageInfo!
  # }

  type CampaignSearchEdge {
    cursor: String!
    node: CampaignResult!
  }

  # @TODO: Example of future page search edge type.
  # type PageSearchEdge {
  #   cursor: String!
  #   node: Page!
  # }

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
