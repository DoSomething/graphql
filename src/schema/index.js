import { mergeSchemas } from 'graphql-tools';
import { printSchema } from 'graphql';
import gql from 'tagged-template-noop';

// Schemas
import northstarSchema from './northstar';
import rogueSchema from './rogue';

/**
 * The schema used to link services together.
 *
 * @var {String}
 */
const linkSchema = gql`
  extend type User {
    # The posts created by this user.
    posts: [Post]
  }

  extend type Post {
    # The user who created this post.
    user: User
  }
`;

/**
 * Resolvers between resources in different schemas.
 *
 * @var {Object}
 */
const linkResolvers = mergeInfo => ({
  User: {
    posts: {
      fragment: 'fragment PostsFragment on User { id }',
      resolve(user, args, context, info) {
        return mergeInfo.delegateToSchema(
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
  },
  Post: {
    user: {
      fragment: 'fragment UserFragment on Post { userId }',
      resolve(post, args, context, info) {
        return mergeInfo.delegateToSchema({
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
});

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

// DEBUG: Print the generated schema!
console.log(printSchema(schema));

export default schema;
