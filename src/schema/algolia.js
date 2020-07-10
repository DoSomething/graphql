import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/algolia';

const typeDefs = gql`
  type Query {
    searchCampaigns(
      "The search term specified or an empty string."
      term: String
      "Search for only open campaigns or only closed campaigns."
      isOpen: Boolean
      "Number of results per page."
      perPage: Int
      "Pagination search cursor for the specified search result."
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
    _id: Int!
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
`;

export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
