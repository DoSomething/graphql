import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import gql from 'tagged-template-noop';
import { urlWithQuery } from '../repositories/helpers';
import Loader from '../loader';
import {
  getCampaignById,
  getCampaigns,
  getPosts,
  getPostsByUserId,
  getPostsByCampaignId,
  getPostsBySignupId,
  getPostById,
  getSignups,
  toggleReaction,
} from '../repositories/rogue';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  scalar AbsoluteUrl

  # Posts are reviewed by DoSomething.org staff for content.
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

  # A campaign.
  type Campaign {
    # The unique ID for this campaign.
    id: Int!
    # The internal name used to identify the campaign.
    internalTitle: String!
  }

  # A media resource on a post.
  type Media {
    # The image URL.
    url(
      # The desired image width, in pixels.
      w: Int
      # The desired image height, in pixels.
      h: Int
    ): AbsoluteUrl
    # The text content of the post, provided by the user.
    text: String
  }

  # A user's post on a campaign.
  type Post {
    # The unique ID for this post.
    id: Int!
    # The type of action (e.g. 'photo', 'voterReg', or 'text').
    type: String!
    # The specific action being performed (or 'default' on a single-action campaign).
    action: String!
    # The Northstar user ID of the user who created this post.
    userId: String!
    # The campaign ID this post was made for. Either a
    # numeric Drupal ID, or a alphanumeric Contentful ID.
    campaignId: String
    # The attached media for this post.
    media: Media
      @deprecated(reason: "Use direct 'url' and 'text' properties instead.")
    # The image URL.
    url(
      # The desired image width, in pixels.
      w: Int
      # The desired image height, in pixels.
      h: Int
    ): AbsoluteUrl
    # The text content of the post, provided by the user.
    text: String
    # The ID of the associated signup for this post.
    signupId: String!
    # The associated signup for this post.
    signup: Signup
    # The review status of the post.
    status: ReviewStatus
    # The source of this post. This is often a Northstar OAuth client.
    source: String
    # The number of items added or removed in this post.
    quantity: Int
    # The tags that have been applied to this post by DoSomething.org staffers.
    tags: [String]
    # The total number of reactions to this post.
    reactions: Int
    # Has the current user reacted to this post?
    reacted: Boolean
    # The IP address this post was created from.
    remoteAddr: String
    # The time this post was last modified.
    updatedAt: DateTime
    # The time when this post was originally created.
    createdAt: DateTime
  }

  # A user's signup for a campaign.
  type Signup {
    # The unique ID for this signup.
    id: Int!
    # The associated posts made under this signup.
    posts: [Post]
    # The campaign ID this signup was made for. Either a
    # numeric Drupal ID, or a alphanumeric Contentful ID.
    campaignId: String
    # The Drupal campaign run ID this signup was made for.
    campaignRunId: String @deprecated
    # The Northstar ID of the user who created this post.
    userId: String
    # The total number of items on all posts attached to this signup.
    quantity: Int
    # The user's self-reported reason for doing this campaign.
    whyParticipated: String
    # More information about the signup (for example, third-party messaging opt-ins).
    details: String
    # The time this signup was last modified.
    updatedAt: DateTime
    # The time when this signup was originally created.
    createdAt: DateTime
  }

  type Query {
    # Get a campaign by ID.
    campaign(id: Int!): Campaign
    # Get a paginated collection of campaigns.
    campaigns(
      # The internal title to load campaigns for.
      internalTitle: String
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Campaign]
    # Get a post by ID.
    post(
      # The desired post ID.
      id: Int!
    ): Post
    # Get a paginated collection of posts.
    posts(
      # The action name to load posts for.
      action: String
      # The campaign ID to load posts for.
      campaignId: String
      # The type name to load posts for.
      type: String
      # The user ID to load posts for.
      userId: String
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Post]
    # Get a paginated collection of posts by campaign ID.
    postsByCampaignId(
      # The campaign ID to load.
      id: String!
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Post]
    # Get a paginated collection of posts by user ID.
    postsByUserId(
      # The Northstar user ID to filter posts by.
      id: String!
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Post]
    # Get a signup by ID.
    signup(id: Int!): Signup
    # Get a paginated collection of signups.
    signups(
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Signup]
  }

  type Mutation {
    # Add or remove a reaction to a post. Requires an access token.
    toggleReaction(
      # The post ID to react to.
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
  Campaign: {
    internalTitle: campaign => campaign.internalTitle,
  },
  Media: {
    url: (media, args) => urlWithQuery(media.url, args),
  },
  Post: {
    signup: (post, args, context) =>
      Loader(context).signups.load(post.signupId),
    url: (post, args) => urlWithQuery(post.media.url, args),
    text: post => post.media.text,
    status: post => post.status.toUpperCase(),
    reacted: post => post.reactions.reacted,
    reactions: post => post.reactions.total,
  },
  Signup: {
    posts: (signup, args, context) => getPostsBySignupId(signup.id, context),
  },
  Query: {
    campaign: (_, args, context) => getCampaignById(args.id, context),
    campaigns: (_, args, context) => getCampaigns(args, context),
    post: (_, args, context) => getPostById(args.id, context),
    posts: (_, args, context) => getPosts(args, context),
    postsByCampaignId: (_, args, context) =>
      getPostsByCampaignId(args.id, args.page, args.count, context),
    postsByUserId: (_, args, context) =>
      getPostsByUserId(args.id, args.page, args.count, context),
    signup: (_, args, context) => Loader(context).signups.load(args.id),
    signups: (_, args, context) => getSignups(args.page, args.count, context),
  },
  Mutation: {
    toggleReaction: (_, args, context) => toggleReaction(args.postId, context),
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
});
