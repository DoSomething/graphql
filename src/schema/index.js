import { gql } from 'apollo-server';
import { mergeSchemas } from 'graphql-tools';

// Schemas
import rogueSchema from './rogue';
import northstarSchema from './northstar';
import gambitContentfulSchema from './contentful/gambit';
import gambitSchema from './gambit';

/**
 * The schema used to link services together.
 *
 * @var {String}
 */
const linkSchema = gql`
  extend type User {
    "The posts created by this user."
    posts: [Post]
    "The signups created by this user."
    signups: [Signup]
    "The conversations created by this user."
    conversations: [Conversation]
  }

  extend type Post {
    "The user who created this post."
    user: User
  }

  extend type Signup {
    "The user who created this signup."
    user: User
  }

  extend type Conversation {
    "The user this conversation is with."
    user: User
    "The current topic of the conversation."
    topic: Topic
  }

  extend type Message {
    "The user this message was sent to or from (depending on message direction)."
    user: User
    "The topic that conversation was set to when the message was created."
    topic: Topic
  }

  extend type AutoReplySignupTopic {
    "The campaign that this topic should create signups for."
    campaign: Campaign
  }

  extend type PhotoPostTopic {
    "The campaign that this topic should create signups and photo posts for."
    campaign: Campaign
  }

  extend type TextPostTopic {
    "The campaign that this topic should create signups and text posts for."
    campaign: Campaign
  }

  extend type WebSignupConfirmation {
    "The campaign that this web signup confirmation is for."
    campaign: Campaign
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
          schema: gambitSchema,
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
    topic: {
      fragment: 'fragment TopicFragment on Conversation { topicId }',
      resolve(conversation, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: gambitContentfulSchema,
          operation: 'query',
          fieldName: 'topic',
          args: {
            id: conversation.topicId,
          },
          context,
          info,
        });
      },
    },
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
          schema: gambitContentfulSchema,
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
    user: {
      fragment: 'fragment UserFragment on Message { userId }',
      resolve(message, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: northstarSchema,
          operation: 'query',
          fieldName: 'user',
          args: {
            id: message.userId,
          },
          context,
          info,
        });
      },
    },
  },
  AutoReplySignupTopic: {
    campaign: {
      fragment:
        'fragment CampaignFragment on AutoReplySignupTopic { campaignId }',
      resolve(topic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.campaignId,
          },
          context,
          info,
        });
      },
    },
  },
  PhotoPostTopic: {
    campaign: {
      fragment: 'fragment CampaignFragment on PhotoPostTopic { campaignId }',
      resolve(topic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.campaignId,
          },
          context,
          info,
        });
      },
    },
  },
  TextPostTopic: {
    campaign: {
      fragment: 'fragment CampaignFragment on TextPostTopic { campaignId }',
      resolve(topic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.campaignId,
          },
          context,
          info,
        });
      },
    },
  },
  WebSignupConfirmation: {
    campaign: {
      fragment:
        'fragment CampaignFragment on WebSignupConfirmation { campaignId }',
      resolve(webSignupConfirmation, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: webSignupConfirmation.campaignId,
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
    gambitContentfulSchema,
    gambitSchema,
    linkSchema,
  ],
  resolvers: linkResolvers,
});

// HACK: Describe the root query/mutation. <https://git.io/vFNw6>
schema._queryType.description =
  'The query root of our GraphQL schema. Start here if you want to read data.';
schema._mutationType.description =
  'The mutation root of our GraphQL schema. Start here if you want to write data';

export default schema;
