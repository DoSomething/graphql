import gql from 'tagged-template-noop';
import { mergeSchemas } from 'graphql-tools';

// Schemas
import rogueSchema from './rogue';
import northstarSchema from './northstar';
import gambitContentSchema from './gambitContent';
import gambitConversationsSchema from './gambitConversations';

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
    # The conversations created by this user.
    conversations: [Conversation]
  }

  extend type Post {
    # The user who created this post.
    user: User
  }

  extend type Signup {
    # The user who created this signup.
    user: User
  }

  extend type Conversation {
    # The user this conversation is with.
    user: User
    # The current topic of the conversation.
    topic: Topic
  }

  extend type Message {
    # The topic that conversation was set to when the message was created.
    topic: Topic
  }
`;

/**
 * Resolvers between resources in different schemas.
 *
 * @var {Object}
 */
const linkResolvers = {
  User: {
    conversations: {
      fragment: 'fragment ConversationsFragment on User { id }',
      resolve(user, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: gambitConversationsSchema,
          operation: 'query',
          fieldName: 'conversationsByUserId',
          args: {
            id: user.id,
          },
          context,
          info,
        });
      },
    },
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
      resolve(signup, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: northstarSchema,
          operation: 'query',
          fieldName: 'user',
          args: {
            id: signup.userId,
          },
          context,
          info,
        });
      },
    },
  },
  Conversation: {
    user: {
      fragment: 'fragment UserFragment on Conversation { userId }',
      resolve(conversation, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: northstarSchema,
          operation: 'query',
          fieldName: 'user',
          args: {
            id: conversation.userId,
          },
          context,
          info,
        });
      },
    },
  },
  Message: {
    topic: {
      fragment: 'fragment TopicFragment on Message { topicId }',
      resolve(message, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: gambitContentSchema,
          operation: 'query',
          fieldName: 'topic',
          args: {
            id: message.topicId,
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
  schemas: [
    northstarSchema,
    rogueSchema,
    gambitConversationsSchema,
    gambitContentSchema,
    linkSchema,
  ],
  resolvers: linkResolvers,
});

// HACK: Describe the root query. <https://git.io/vFNw6>
schema._queryType.description =
  "The query root of DoSomething.org's GraphQL interface. Start here if you want to read data from any service.";

export default schema;
