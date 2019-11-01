import { gql } from 'apollo-server';
import { getFields } from 'fielddataloader';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import { GraphQLDateTime } from 'graphql-iso-date';
import { makeExecutableSchema } from 'graphql-tools';

import Loader from '../loader';
import { urlWithQuery } from '../repositories/helpers';
import OptionalFieldDirective from './directives/OptionalFieldDirective';
import {
  getActionById,
  getCampaigns,
  getPaginatedCampaigns,
  getPermalinkBySignupId,
  getPosts,
  getPostsByUserId,
  getPostsByCampaignId,
  getPostsBySignupId,
  getPostById,
  getSignups,
  getSignupsByUserId,
  getSignupsCount,
  toggleReaction,
  getPostsCount,
  makeImpactStatement,
  parseCampaignCauses,
} from '../repositories/rogue';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  scalar AbsoluteUrl

  directive @requires(fields: String!) on FIELD_DEFINITION

  directive @optional on FIELD_DEFINITION

  "Posts are reviewed by DoSomething.org staff for content."
  enum ReviewStatus {
    ACCEPTED
    REJECTED
    PENDING
    REGISTER_FORM
    REGISTER_OVR
    CONFIRMED
    INELIGIBLE
    UNCERTAIN
  }

  enum LocationFormat {
    "Machine-readable ISO-3166-2 format (e.g. US-NY)"
    ISO_FORMAT
    "Human-readable location name."
    HUMAN_FORMAT
  }

  "A cause space."
  type Cause {
    id: String!
    name: String!
  }

  "A campaign."
  type Campaign {
    "The time when this campaign was originally created."
    createdAt: DateTime
    "The time when this campaign ends."
    endDate: DateTime
    "The unique ID for this campaign."
    id: Int!
    "The internal name used to identify the campaign."
    internalTitle: String!
    "Collection of Actions associated to the Campaign."
    actions: [Action]
    "The cause-spaces for this campaign."
    causes: [Cause] @requires(fields: "cause causeNames")
    "Is this campaign open?"
    isOpen: Boolean!
    "The number of posts pending review. Only visible by staff/admins."
    pendingCount: Int @optional
    "The time when this campaign starts."
    startDate: DateTime
    "The time when this campaign last modified."
    updatedAt: DateTime
  }

  "Experimental: A paginated list of campaigns. This is a 'Connection' in Relay's parlance, and follows the [Relay Cursor Connections](https://dfurn.es/338oQ6i) specification."
  type CampaignCollection {
    edges: [CampaignEdge]
    pageInfo: PageInfo!
  }

  "Experimental: Campaign in a paginated list."
  type CampaignEdge {
    cursor: String!
    node: Campaign!
  }

  "Experimental: Information about a paginated list."
  type PageInfo {
    endCursor: String,
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type Action {
    "The unique ID for this action."
    id: Int!
    "The internal name for this action."
    name: String
    "Does this action count as a reportback?"
    reportback: Boolean
    "Campaign ID this action belongs to"
    campaignId: Int!
    "Does this action count as a civic action?"
    civicAction: Boolean
    "Does this action count as a scholarship entry?"
    scholarshipEntry: Boolean
    "Anonymous actions will not be attributed to a particular user in public galleries."
    anonymous: Boolean
    "The noun for this action, e.g. 'cards' or 'jeans'."
    noun: String
    "The verb for this action, e.g. 'donated' or 'created'."
    verb: String
    "The time when this action was originally created."
    createdAt: DateTime
    "The time when this action was last modified."
    updatedAt: DateTime
    "How long will this action take to complete?"
    timeCommitmentLabel: String
    "What type of action is this?"
    actionLabel: String
  }

  "A media resource on a post."
  type Media {
    "The image URL."
    url(
      "The desired image width, in pixels."
      w: Int
      "The desired image height, in pixels."
      h: Int
    ): AbsoluteUrl
    "The text content of the post, provided by the user."
    text: String
  }

  "A user's post on a campaign."
  type Post {
    "The unique ID for this post."
    id: Int!
    "The type of action (e.g. 'photo', 'voterReg', or 'text')."
    type: String!
    "The specific action being performed (or 'default' on a single-action campaign)."
    action: String! @deprecated(reason: "Use 'actionDetails' relationship instead.")
    "The specific action being performed."
    actionDetails: Action
    "The Northstar user ID of the user who created this post."
    userId: String
    "The Rogue campaign ID this post was made for."
    campaignId: String
    "The location this post was submitted from. This is provided by Fastly geo-location headers on the web."
    location(format: LocationFormat = ISO_FORMAT): String
    "The attached media for this post."
    media: Media
      @deprecated(reason: "Use direct 'url' and 'text' properties instead.")
    "The image URL."
    url(
      "The desired image width, in pixels."
      w: Int
      "The desired image height, in pixels."
      h: Int
    ): AbsoluteUrl
    "The text content of the post, provided by the user."
    text: String
    "The ID of the associated signup for this post."
    signupId: String!
    "The associated signup for this post."
    signup: Signup
    "The review status of the post."
    status: ReviewStatus
    "The source of this post. This is often a Northstar OAuth client."
    source: String
    "The number of items added or removed in this post."
    quantity: Int
    "The human-readable impact (quantity, noun, and verb)."
    impact: String
    "The tags that have been applied to this post by DoSomething.org staffers."
    tags: [String]
    "The total number of reactions to this post."
    reactions: Int
    "Has the current user reacted to this post?"
    reacted: Boolean
    "The IP address this post was created from."
    remoteAddr: String @deprecated(reason: "This field is no longer stored.")
    "The time this post was last modified."
    updatedAt: DateTime
    "The time when this post was originally created."
    createdAt: DateTime
    "Permalink to Admin view."
    permalink: String
  }

  "A user's signup for a campaign."
  type Signup {
    "The unique ID for this signup."
    id: Int!
    "The associated posts made under this signup."
    posts: [Post]
    "The associated campaign for this signup."
    campaign: Campaign
    "The Rogue campaign ID this post was made for."
    campaignId: String
    "The Drupal campaign run ID this signup was made for."
    campaignRunId: String @deprecated(reason: "We no longer stored campaign run IDs.")
    "The Northstar ID of the user who created this signup."
    userId: String
    "The total number of items on all posts attached to this signup."
    quantity: Int
    "The user's self-reported reason for doing this campaign."
    whyParticipated: String
    "The source of this signup (e.g. sms, phoenix-next)"
    source: String
    "More information about the signup (for example, third-party messaging opt-ins)."
    details: String
    "The time this signup was last modified."
    updatedAt: DateTime
    "The time when this signup was originally created."
    createdAt: DateTime
    "Permalink to Admin view."
    permalink: String
  }

  type Query {
    "Get an Action by ID."
    action(id: Int!): Action
    "Get collection of Actions by Campaign ID."
    actions(campaignId: Int!): [Action]
    "Get a campaign by ID."
    campaign(id: Int!): Campaign
    "Get a list of campaigns."
    campaigns(
      "The internal title to load campaigns for."
      internalTitle: String
      "The page of results to return."
      page: Int = 1
      "Only return campaigns that are open or closed."
      isOpen: Boolean
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
      "The number of results per page."
      count: Int = 20
    ): [Campaign]
    "Experimental: Get a Relay-style paginated collection of campaigns."
    paginatedCampaigns(
      "Get the first N results."
      first: Int = 20
      "The cursor to return results after."
      after: String,
      "Only return campaigns that are open or closed."
      isOpen: Boolean
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
      ): CampaignCollection
    "Get a post by ID."
    post(
      "The desired post ID."
      id: Int!
    ): Post
    "Get a paginated collection of posts."
    posts(
      "The action name to load posts for."
      action: String
      "The action IDs to load posts for."
      actionIds: [Int]
      "# The campaign ID to load posts for."
      campaignId: String
      "The location to load posts for."
      location: String
      "# The post source to load posts for."
      source: String
      "# The tags to load posts for."
      tags: [String]
      "# The type name to load posts for."
      type: String
      "# The user ID to load posts for."
      userId: String
      "# The page of results to return."
      page: Int = 1
      "# The number of results per page."
      count: Int = 20
    ): [Post]
    " Get a paginated collection of posts by campaign ID."
    postsByCampaignId(
      "The campaign ID to load."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Post]
    "Get a paginated collection of posts by user ID."
    postsByUserId(
      "The Northstar user ID to filter posts by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Post]
    "Get a signup by ID."
    signup(id: Int!): Signup
    "Get a paginated collection of signups."
    signups(
      "The Campaign ID load signups for."
      campaignId: String
      "The signup source to load signups for."
      source: String
      "The user ID to load signups for."
      userId: String
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [Signup]
    "Get a paginated collection of signups by user ID."
    signupsByUserId(
      "The Northstar user ID to filter signups by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [Signup]
    "Find out how many signups a particular user has. Intended for use with badges."
    signupsCount(
      "The Campaign ID count signups for."
      campaignId: String
      "The signup source to count signups for."
      source: String
      "The user ID to count signups for."
      userId: String
      "# The maximum count to report."
      limit: Int = 20
    ): Int
    "Get post counts."
    postsCount(
      "The action name to count posts for."
      action: String
      "The action IDs to count posts for."
      actionIds: [Int]
      "# The campaign ID to count posts for."
      campaignId: String
      "The location to count posts for."
      location: String
      "# The post source to count posts for."
      source: String
      "# The type name to count posts for."
      type: String
      "# The user ID to count posts for."
      userId: String
      "A comma-separated list of tags to filter by."
      tags: String
      "# The maximum count to report."
      limit: Int = 20
    ): Int
  }

  type Mutation {
    "Add or remove a reaction to a post. Requires an access token."
    toggleReaction(
      "The post ID to react to."
      postId: Int!
    ): Post
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Media: {
    url: (media, args) => urlWithQuery(media.url, args),
  },
  Post: {
    signup: (post, args, context) =>
      Loader(context).signups.load(post.signupId),
    url: (post, args) => urlWithQuery(post.media.url, args),
    text: post => post.media.text,
    status: post => post.status.toUpperCase().replace('-', '_'),
    actionDetails: post => post.actionDetails.data,
    location: (post, { format }) => {
      switch (format) {
        case 'HUMAN_FORMAT':
          return post.locationName;
        case 'ISO_FORMAT':
          return post.location;
        default:
          return null;
      }
    },
    impact: post => makeImpactStatement(post),
    reacted: post => post.reactions.reacted,
    reactions: post => post.reactions.total,
    permalink: post => getPermalinkBySignupId(post.signupId),
  },
  Signup: {
    campaign: (signup, args, context, info) =>
      Loader(context).campaigns.load(signup.campaignId, getFields(info)),
    permalink: signup => getPermalinkBySignupId(signup.id),
    posts: (signup, args, context) => getPostsBySignupId(signup.id, context),
  },
  Query: {
    action: (_, args, context) => getActionById(args.id, context),
    actions: (_, args, context) =>
      Loader(context).actionsByCampaignId.load(args.campaignId),
    campaign: (_, args, context, info) =>
      Loader(context).campaigns.load(args.id, getFields(info)),
    campaigns: (_, args, context, info) =>
      getCampaigns(args, getFields(info), context),
    paginatedCampaigns: (_, args, context, info) =>
      getPaginatedCampaigns(args, context, info),
    post: (_, args, context) => getPostById(args.id, context),
    posts: (_, args, context) => getPosts(args, context),
    postsByCampaignId: (_, args, context) =>
      getPostsByCampaignId(args.id, args.page, args.count, context),
    postsByUserId: (_, args, context) =>
      getPostsByUserId(args.id, args.page, args.count, context),
    signup: (_, args, context) => Loader(context).signups.load(args.id),
    signups: (_, args, context) => getSignups(args, context),
    signupsByUserId: (_, args, context) => getSignupsByUserId(args, context),
    signupsCount: (_, args, context) => getSignupsCount(args, context),
    postsCount: (_, args, context) => getPostsCount(args, context),
  },
  Mutation: {
    toggleReaction: (_, args, context) => toggleReaction(args.postId, context),
  },
  Campaign: {
    actions: (campaign, args, context) =>
      Loader(context).actionsByCampaignId.load(campaign.id),
    causes: campaign => parseCampaignCauses(campaign),
  },
};

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    optional: OptionalFieldDirective,
  },
});
