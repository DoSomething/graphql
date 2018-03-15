import { makeExecutableSchema } from 'graphql-tools';
import { URL, URLSearchParams } from 'url';
import { omit, isUndefined } from 'lodash';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import gql from 'tagged-template-noop';
import Rogue, {
  getPosts,
  getPostsByUserId,
  getPostsBySignupId,
  getPostById,
  getSignups,
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
    # The Northstar user ID of the user who created this post.
    userId: String
    # The campaign ID this post was made for. Either a
    # numeric Drupal ID, or a alphanumeric Contentful ID.
    campaignId: String
    # The attached media for this post.
    media: Media
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
    # Get a post by ID.
    post(
      # The desired post ID.
      id: Int!
    ): Post
    # Get a paginated collection of posts.
    posts(
      # The page of results to return.
      page: Int = 1
      # The number of results per page.
      count: Int = 20
    ): [Post]
    # Get a paginted collection of posts by user ID.
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
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Media: {
    url(media, args) {
      try {
        const url = new URL(media.url);

        // Replace existing query params with given arguments.
        url.search = new URLSearchParams(omit(args, isUndefined));

        return url.toString();
      } catch (exception) {
        // If we get mangled 'default' as URL, return null.
        return null;
      }
    },
  },
  Post: {
    signup: (post, args, context) => Rogue(context).signups.load(post.signupId),
    status: post => post.status.toUpperCase(),
  },
  Signup: {
    posts: (signup, args, context) => getPostsBySignupId(signup.id, context),
  },
  Query: {
    post: (_, args, context) => getPostById(args.id, context),
    posts: (_, args, context) => getPosts(args.page, args.count, context),
    postsByUserId: (_, args, context) =>
      getPostsByUserId(args.id, args.page, args.count, context),
    signup: (_, args, context) => Rogue(context).signups.load(args.id),
    signups: (_, args, context) => getSignups(args.page, args.count, context),
  },
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
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
