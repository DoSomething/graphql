import GraphQLJSON from 'graphql-type-json';
import { getFields } from 'fielddataloader';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import { GraphQLDateTime } from 'graphql-iso-date';

import Loader from '../loader';
import { transformItem } from '../shared/helpers/transformers';
import { urlWithQuery } from '../shared/helpers/url';
import {
  getActionById,
  getActionStats,
  getCampaigns,
  getClubById,
  getClubs,
  getGroupById,
  getGroups,
  getGroupTypeById,
  getGroupTypes,
  getPaginatedActionStats,
  getPaginatedCampaigns,
  getPaginatedGroups,
  getPermalinkBySignupId,
  getPermalinkByPostId,
  getPosts,
  getPaginatedPosts,
  getPostsByUserId,
  getPostsByCampaignId,
  getPostsBySignupId,
  getPostById,
  getSignups,
  getPaginatedSignups,
  getSignupsByUserId,
  getSignupsCount,
  getVoterRegistrationsCountByGroupId,
  getVoterRegistrationsCountByReferrerUserId,
  toggleReaction,
  getPostsCount,
  makeImpactStatement,
  parseCampaignCauses,
  updatePostQuantity,
  reviewPost,
  tagPost,
  rotatePost,
  deletePost,
  createSignup,
  deleteSignup,
} from '../repositories/rogue';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    action: (_, args, context) => getActionById(args.id, context),
    actions: (_, args, context) =>
      Loader(context).actionsByCampaignId.load(args.campaignId),
    campaign: (_, args, context) => Loader(context).campaigns.load(args.id),
    campaigns: (_, args, context) => getCampaigns(args, context),
    clubs: (_, args, context) => getClubs(args, context),
    club: (_, args, context) => getClubById(args.id, context),
    group: (_, args, context) => getGroupById(args.id, context),
    groups: (_, args, context) => getGroups(args, context),
    groupType: (_, args, context) => getGroupTypeById(args.id, context),
    groupTypes: (_, args, context) => getGroupTypes(args, context),
    paginatedCampaigns: (_, args, context) =>
      getPaginatedCampaigns(args, context),
    paginatedGroups: (_, args, context) => getPaginatedGroups(args, context),
    paginatedPosts: (_, args, context) => getPaginatedPosts(args, context),
    paginatedSchoolActionStats: (_, args, context) =>
      getPaginatedActionStats(args, context),
    post: (_, args, context) => getPostById(args.id, context),
    posts: (_, args, context) => getPosts(args, context),
    postsByCampaignId: (_, args, context) =>
      getPostsByCampaignId(args.id, args.page, args.count, context),
    postsByUserId: (_, args, context) =>
      getPostsByUserId(args.id, args.page, args.count, context),
    schoolActionStats: (_, args, context) => getActionStats(args, context),
    signup: (_, args, context) => Loader(context).signups.load(args.id),
    signups: (_, args, context) => getSignups(args, context),
    paginatedSignups: (_, args, context) => getPaginatedSignups(args, context),
    signupsByUserId: (_, args, context) => getSignupsByUserId(args, context),
    signupsCount: (_, args, context) => getSignupsCount(args, context),
    postsCount: (_, args, context) => getPostsCount(args, context),
    voterRegistrationsCountByGroupId: (_, args, context) =>
      getVoterRegistrationsCountByGroupId(args.groupId, context),
    voterRegistrationsCountByReferrerUserId: (_, args, context) =>
      getVoterRegistrationsCountByReferrerUserId(args.referrerUserId, context),
  },

  Mutation: {
    toggleReaction: (_, args, context) => toggleReaction(args.postId, context),
    updatePostQuantity: (_, args, context) =>
      updatePostQuantity(args.id, args.quantity, context),
    reviewPost: (_, args, context) => reviewPost(args.id, args.status, context),
    tagPost: (_, args, context) => tagPost(args.id, args.tag, context),
    rotatePost: (_, args, context) =>
      rotatePost(args.id, args.degrees, context),
    deletePost: (_, args, context) => deletePost(args.id, context),
    createSignup: (_, args, context) => createSignup(args, context),
    deleteSignup: (_, args, context) => deleteSignup(args.id, context),
  },

  AbsoluteUrl: GraphQLAbsoluteUrl,

  Action: {
    campaign: (action, args, context, info) =>
      Loader(context).campaigns.load(action.campaignId, getFields(info)),
    schoolActionStats: (action, args, context) =>
      getActionStats(args.schoolId, action.id, args.orderBy, context),
  },

  Campaign: {
    actions: (campaign, args, context) =>
      Loader(context).actionsByCampaignId.load(campaign.id),
    causes: campaign => parseCampaignCauses(campaign),
    groupType: (campaign, args, context, info) =>
      campaign.groupTypeId
        ? Loader(context).groupTypes.load(campaign.groupTypeId, getFields(info))
        : null,
  },

  DateTime: GraphQLDateTime,

  Group: {
    groupType: (group, args, context, info) =>
      Loader(context).groupTypes.load(group.groupTypeId, getFields(info)),
  },

  JSON: GraphQLJSON,

  Media: {
    url: (media, args) => urlWithQuery(media.url, args),
  },

  Post: {
    campaign: (post, args, context, info) =>
      Loader(context).campaigns.load(post.campaignId, getFields(info)),
    group: (post, args, context, info) =>
      post.groupId
        ? Loader(context).groups.load(post.groupId, getFields(info))
        : null,
    signup: (post, args, context) =>
      Loader(context).signups.load(post.signupId),
    url: (post, args) => urlWithQuery(post.media.url, args),
    text: post => post.media.text,
    status: post => post.status.toUpperCase().replace('-', '_'),
    actionDetails: post => transformItem(post.actionDetails),
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
    permalink: post => getPermalinkByPostId(post.id),
  },

  SchoolActionStat: {
    acceptedQuantity: actionStat => actionStat.impact,
    action: (schoolActionStat, args, context, info) =>
      Loader(context).actions.load(schoolActionStat.actionId, getFields(info)),
  },

  Signup: {
    campaign: (signup, args, context, info) =>
      Loader(context).campaigns.load(signup.campaignId, getFields(info)),
    group: (signup, args, context, info) =>
      signup.groupId
        ? Loader(context).groups.load(signup.groupId, getFields(info))
        : null,
    permalink: signup => getPermalinkBySignupId(signup.id),
    posts: (signup, args, context) => getPostsBySignupId(signup.id, context),
  },
};

export default resolvers;
