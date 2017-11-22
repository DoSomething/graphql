import { makeExecutableSchema } from 'graphql-tools';
import {
  getPosts,
  getPostsByUserId,
  getPostsBySignupId,
  getPostById,
  getSignups,
  getSignupById
} from '../repositories/rogue';
import gql from 'tagged-template-noop';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  # A media resource on a post.
  type Media {
    url: String,
    caption: String,
  }

  # A user's post on a campaign.
  type Post {
    id: Int!
		northstarId: String,
    signupId: String!,
    media: Media,
    caption: String,
    signup: Signup,
  }

  # A user's signup for a campaign.
  type Signup {
    id: Int!
    posts: [Post],
		campaignId: String,
		northstarId: String,
    whyParticipated: String,
  }

  type Query {
    post(id: Int!): Post
    posts(page: Int, count: Int): [Post]
    postsByUserId(id: String!): [Post]
    signup(id: Int!): Signup
    signups(page: Int, count: Int): [Signup]
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Post: {
    signup(post) {
      return getSignupById(post.signupId);
    },
  },
  Signup: {
    posts(signup) {
      return getPostsBySignupId(signup.id);
    },
  },
  Query: {
    post: (_, { id }) => getPostById(id),
    posts: (_, { page = 1, count = 20 }) => getPosts(page, count),
    postsByUserId: (_, { id }) => getPostsByUserId(id),
    signup: (_, { id }) => getSignupById(id),
    signups: (_, { page = 1, count = 20 }) => getSignups(page, count),
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
