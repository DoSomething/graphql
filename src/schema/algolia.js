import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../resolvers/algolia';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  type Query {
    searchCampaigns(
      "Filter by campaigns containing these action types."
      actionTypes: [String]
      "Filter by campaigns containing these causes."
      causes: [String]
      "Pagination search cursor for the specified search location."
      cursor: String
      "Exclude campaigns with specified IDs"
      excludeIds: [Int]
      "Search for campaigns that have or do not have a scholarship."
      hasScholarship: Boolean
      "Filter for campaigns that have a Contentful campaign associated."
      hasWebsite: Boolean
      "Filter by campaigns that are online or offline."
      isOnline: Boolean
      "Search for only open campaigns or only closed campaigns."
      isOpen: Boolean
      "Search for only group or non-group campaigns."
      isGroupCampaign: Boolean
      "How to order the results (e.g. 'start_date,desc')."
      orderBy: String
      "Number of results per page."
      perPage: Int
      "The search term specified or an empty string."
      term: String
      "Filter by campaigns containing these time commitments"
      timeCommitments: [String]
    ): AlgoliaCampaignCollection!
  }

  "Collection of cursor paginated campaigns."
  type AlgoliaCampaignCollection {
    "List of edges containing metadata for each item in list."
    edges: [CampaignSearchEdge]
    "Metadata regarding additional pages of data."
    pageInfo: PageInfo!
  }

  type CampaignSearchEdge {
    "Location in cursor pagination for this item."
    cursor: String!
    "Campaign ID for this item."
    campaignId: Int!
  }

  type PageInfo {
    "Location of next item in cursor paginated list."
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
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
