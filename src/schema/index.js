import gql from 'tagged-template-noop';
import { mergeSchemas } from 'graphql-tools';

// Schemas
import rogueSchema from './rogue';
import northstarSchema from './northstar';

/**
 * The schema used to link services together.
 *
 * @var {String}
 */
const linkSchema = gql`
  extend type User {
    # The posts created by this user.
    posts: [Post]
    # The signups created by this user.
    signups: [Signup]
  }

  extend type Post {
    # The user who created this post.
    user: User
  }

  extend type Signup {
    # The user who created this signup.
    user: User
  }
`;

/**
 * Resolvers between resources in different schemas.
 *
 * @var {Object}
 */
const linkResolvers = {
  User: {
    posts: {
      fragment: 'fragment PostsFragment on User { id }',
      resolve(user, args, context, info) {
        return info.mergeInfo.delegateToSchema(
          'query',
          'postsByUserId',
          {
            id: user.id,
          },
          context,
          info,
        );
      },
    },
    signups: {
      fragment: 'fragment SignupsFragment on User { id }',
      resolve(user, args, context, info) {
        return info.mergeInfo.delegateToSchema(
          'query',
          'signupsByUserId',
          {
            id: user.id,
          },
          context,
          info,
        );
      },
    },
  },
  Post: {
    user: {
      fragment: 'fragment UserFragment on Post { userId }',
      resolve(post, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: northstarSchema,
          operation: 'query',
          fieldName: 'user',
          args: {
            id: post.userId,
          },
          context,
          info,
        });
      },
    },
  },
  Signup: {
    user: {
      fragment: 'fragment UserFragment on Signup { userId }',
      resolve(post, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: northstarSchema,
          operation: 'query',
          fieldName: 'user',
          args: {
            id: post.userId,
          },
          context,
          info,
        });
      },
    },
  },
};

/**
 * The merged GraphQL schema.
 *
 * @var GraphQLSchema
 */
const schema = mergeSchemas({
  schemas: [northstarSchema, rogueSchema, linkSchema],
  resolvers: linkResolvers,
});

// HACK: Describe the root query. <https://git.io/vFNw6>
schema._queryType.description =
  "The query root of DoSomething.org's GraphQL interface. Start here if you want to read data from any service.";

export default schema;
