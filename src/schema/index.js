import { gql } from 'apollo-server';
import { mergeSchemas } from 'graphql-tools';

// Schemas
import embedSchema from './embed';
import rogueSchema from './rogue';
import gambitSchema from './gambit';
import algoliaSchema from './algolia';
import schoolsSchema from './schools';
import northstarSchema from './northstar';
import gambitContentfulSchema from './contentful/gambit';
import phoenixContentfulSchema from './contentful/phoenix';

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
    "The user's current school. Note -- only works if user.schoolId is also returned"
    school: School
  }

  extend type Post {
    "The user who created this post."
    user: User
    "The school associated with the post. Note -- only works if post.schoolId is also returned"
    school: School
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

  extend type AutoReplyTopic {
    "The campaign that this topic should create signups for."
    campaign: Campaign
  }

  extend type PetitionSubmissionBlock {
    "The Action that posts will be submitted for. Note -- only works if actionId is also returned."
    action: Action
  }

  extend type PhotoPostTopic {
    "The campaign that this topic should create signups and photo posts for."
    campaign: Campaign
  }

  extend type PhotoSubmissionBlock {
    "The Action that posts will be submitted for. Note -- only works if actionId is also returned."
    action: Action
  }

  extend type ShareBlock {
    "The Action that posts will be submitted for. Note -- only works if actionId is also returned."
    action: Action
  }

  extend type TextPostTopic {
    "The campaign that this topic should create signups and text posts for."
    campaign: Campaign
  }

  extend type TextSubmissionBlock {
    "The Action that posts will be submitted for. Note -- only works if actionId is also returned."
    action: Action
  }

  extend type WebSignupConfirmation {
    "The campaign that this web signup confirmation is for."
    campaign: Campaign
  }

  extend type AskVotingPlanStatusBroadcastTopic {
    "The action that this broadcast is associated to."
    action: Action
  }

  extend type AskYesNoBroadcastTopic {
    "The action that this broadcast is associated to."
    action: Action
  }

  extend type PhotoPostBroadcast {
    "The action that this broadcast is associated to."
    action: Action
  }

  extend type TextPostBroadcast {
    "The action that this broadcast is associated to."
    action: Action
  }

  extend type School {
    "Aggregate post information for this school by action."
    schoolActionStats(
      "The action ID to show a school action stat for."
      actionId: Int
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [SchoolActionStat]
  }

  extend type SchoolActionStat {
    "The school that this school action stat is for."
    school: School
  }

  extend type Campaign {
    "The contentful campaign that is associated with the rogue campaign."
    campaignWebsite: CampaignWebsite
  }

  extend type CampaignSearchEdge {
    "The campaign data for the campaign search result."
    node: Campaign!
  }
`;

function blockActionResolver(blockTypeName) {
  return {
    fragment: `fragment ActionFragment on ${blockTypeName} { block }`,
    resolve(block, args, context, info) {
      if (!block.actionId) {
        return null;
      }

      return info.mergeInfo.delegateToSchema({
        schema: rogueSchema,
        operation: 'query',
        fieldName: 'action',
        args: {
          id: block.actionId,
        },
        context,
        info,
      });
    },
  };
}

/**
 * Resolvers between resources in different schemas.
 *
 * @var {Object}
 */
const linkResolvers = {
  AskVotingPlanStatusBroadcastTopic: {
    action: {
      fragment:
        'fragment ActionFragment on AskVotingPlanStatusBroadcastTopic { saidVotedTransition }',
      resolve(broadcastTopic, args, context, info) {
        // We might get asked for the broadcast without including the saidVotedTransition
        // NOTE: However, if this is true, action would not be included!
        if (
          !broadcastTopic.saidVotedTransition ||
          !broadcastTopic.saidVotedTransition.topic
        ) {
          return null;
        }
        // We assume the broadcast will be associated with the
        // action's campaign Id of the saidVotedTransition topic
        const actionId = broadcastTopic.saidVotedTransition.topic.actionId;
        // check in case the transition does not support an actionId
        if (!actionId) {
          return null;
        }
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'action',
          args: {
            id: actionId,
          },
          context,
          info,
        });
      },
    },
  },

  AskYesNoBroadcastTopic: {
    action: {
      fragment:
        'fragment ActionFragment on AskYesNoBroadcastTopic { saidYesTransition }',
      resolve(broadcastTopic, args, context, info) {
        // We assume the broadcast will be associated with the
        // action's campaign Id of the saidYesTransition topic
        const actionId = broadcastTopic.saidYesTransition.topic.actionId;
        // AskYesNo broadcasts that reference an autoReplyTransition as the
        // saidYes field will not have an actionId set
        if (!actionId) {
          return null;
        }
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'action',
          args: {
            id: actionId,
          },
          context,
          info,
        });
      },
    },
  },

  PetitionSubmissionBlock: {
    action: blockActionResolver('PetitionSubmissionBlock'),
  },

  PhotoPostBroadcast: {
    action: {
      fragment: 'fragment ActionFragment on PhotoPostBroadcast { topic }',
      resolve(broadcastTopic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'action',
          args: {
            id: broadcastTopic.topic.actionId,
          },
          context,
          info,
        });
      },
    },
  },

  PhotoSubmissionBlock: {
    action: blockActionResolver('PhotoSubmissionBlock'),
  },

  ShareBlock: {
    action: blockActionResolver('ShareBlock'),
  },

  TextPostBroadcast: {
    action: {
      fragment: 'fragment ActionFragment on TextPostBroadcast { topic }',
      resolve(broadcastTopic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'action',
          args: {
            id: broadcastTopic.topic.actionId,
          },
          context,
          info,
        });
      },
    },
  },

  TextSubmissionBlock: {
    action: blockActionResolver('TextSubmissionBlock'),
  },

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
    school: {
      fragment: 'fragment SchoolFragment on User { id }',
      resolve(user, args, context, info) {
        if (!user.schoolId) {
          return null;
        }

        return info.mergeInfo.delegateToSchema({
          schema: schoolsSchema,
          operation: 'query',
          fieldName: 'school',
          args: {
            id: user.schoolId,
          },
          context,
          info,
        });
      },
    },
  },

  Post: {
    user: {
      fragment: 'fragment UserFragment on Post { userId }',
      resolve(post, args, context, info) {
        if (!post.userId) {
          return null;
        }

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
    school: {
      fragment: 'fragment SchoolFragment on Post { id }',
      resolve(post, args, context, info) {
        if (!post.schoolId) {
          return null;
        }

        return info.mergeInfo.delegateToSchema({
          schema: schoolsSchema,
          operation: 'query',
          fieldName: 'school',
          args: {
            id: post.schoolId,
          },
          context,
          info,
        });
      },
    },
  },

  School: {
    schoolActionStats: {
      fragment: 'fragment SchoolActionStatsFragment on School { schoolId }',
      resolve(school, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'schoolActionStats',
          args: {
            schoolId: school.id,
            actionId: args.actionId,
            orderBy: args.orderBy,
          },
          context,
          info,
        });
      },
    },
  },

  SchoolActionStat: {
    school: {
      fragment: 'fragment SchoolFragment on SchoolActionStat { id }',
      resolve(schoolActionStat, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: schoolsSchema,
          operation: 'query',
          fieldName: 'school',
          args: {
            id: schoolActionStat.schoolId,
          },
          context,
          info,
        });
      },
    },
  },

  Campaign: {
    campaignWebsite: {
      fragment:
        'fragment CampaignWebsiteFragment on Campaign { contentfulCampaignId }',
      resolve(campaign, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: phoenixContentfulSchema,
          operation: 'query',
          fieldName: 'campaignWebsite',
          args: {
            id: campaign.contentfulCampaignId,
          },
          context,
          info,
        });
      },
    },
  },

  CampaignSearchEdge: {
    node: {
      fragment:
        'fragment CampaignFragment on CampaignSearchEdge { campaignId }',
      resolve(edge, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: edge.campaignId,
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

  AutoReplyTopic: {
    campaign: {
      fragment:
        'fragment CampaignFragment on AutoReplyTopic { legacyCampaign }',
      resolve(topic, args, context, info) {
        // not required in Gambini so it could be empty
        if (!topic.legacyCampaign) {
          return null;
        }
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.legacyCampaign.campaignId,
          },
          context,
          info,
        });
      },
    },
  },

  PhotoPostTopic: {
    campaign: {
      fragment:
        'fragment CampaignFragment on PhotoPostTopic { legacyCampaign }',
      resolve(topic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.legacyCampaign.campaignId,
          },
          context,
          info,
        });
      },
    },
  },

  TextPostTopic: {
    campaign: {
      fragment: 'fragment CampaignFragment on TextPostTopic { legacyCampaign }',
      resolve(topic, args, context, info) {
        return info.mergeInfo.delegateToSchema({
          schema: rogueSchema,
          operation: 'query',
          fieldName: 'campaign',
          args: {
            id: topic.legacyCampaign.campaignId,
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
  mergeDirectives: true,
  schemas: [
    algoliaSchema,
    embedSchema,
    northstarSchema,
    rogueSchema,
    phoenixContentfulSchema,
    gambitContentfulSchema,
    gambitSchema,
    linkSchema,
    schoolsSchema,
  ],
  resolvers: linkResolvers,
});

// HACK: Describe the root query/mutation. <https://git.io/vFNw6>
schema._queryType.description =
  'The query root of our GraphQL schema. Start here if you want to read data.';
schema._mutationType.description =
  'The mutation root of our GraphQL schema. Start here if you want to write data';

export default schema;
