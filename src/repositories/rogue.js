import pluralize from 'pluralize';
import logger from 'heroku-logger';
import { find, isUndefined, omit, zipWith } from 'lodash';

import config from '../../config';
import Collection from './Collection';
import { enumToString } from '../resolvers/helpers';
import {
  querify,
  transformItem,
  transformCollection,
  authorizedRequest,
  requireAuthorizedRequest,
} from './helpers';

const ROGUE_URL = config('services.rogue.url');

/**
 * Fetch an action from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getActionById = async (id, context) => {
  logger.debug('Loading action from Rogue', {
    id,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/actions/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch actions from Rogue
 * @param {Number} campaign_id
 * @return {Array}
 */
export const getActionsByCampaignId = async (campaignId, context) => {
  logger.debug('Loading actions from Rogue', {
    campaignId,
  });

  const queryString = querify({
    filter: { campaign_id: campaignId },
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/actions/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Get a list of action stats.
 *
 * @param {Number} actionId
 * @param {Number} groupTypeId
 * @param {String} location
 * @param {String} schoolId
 * @param {String} orderBy
 * @return {Array}
 */
export const fetchActionStats = async (args, context, additionalQuery = {}) => {
  logger.debug('Loading action-stats from Rogue', {
    schoolId: args.schoolId,
    actionId: args.actionId,
    groupTypeId: args.groupTypeId,
  });

  const filter = omit(
    {
      action_id: args.actionId,
      group_type_id: args.groupTypeId,
      location: args.location,
      school_id: args.schoolId,
    },
    isUndefined,
  );

  const queryString = querify({
    filter,
    orderBy: args.orderBy,
    pagination: 'cursor',
    ...additionalQuery,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/action-stats/${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Get a simple list of action stats.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getActionStats = async (args, context) => {
  const json = await fetchActionStats(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a paginated action stat collection.
 *
 * @return {Collection}
 */
export const getPaginatedActionStats = async (args, context) => {
  const json = await fetchActionStats(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch a campaign from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getCampaignById = async (id, context) => {
  logger.debug('Loading campaign from Rogue', { id });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/campaigns/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch campaigns from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @param {Number} groupTypeId
 * @return {Array}
 */
export const fetchCampaigns = async (args, context, additionalQuery = {}) => {
  const filter = omit(
    {
      is_open: args.isOpen,
      cause: args.causes ? args.causes.join(',') : undefined,
      has_website: args.hasWebsite,
      group_type_id: args.groupTypeId,
    },
    isUndefined,
  );

  const queryString = querify({
    filter,
    orderBy: args.orderBy,
    pagination: 'cursor',
    ...additionalQuery,
  });

  logger.info('Loading campaigns from Rogue', { queryString });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/campaigns/${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Get a simple list of campaigns.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getCampaigns = async (args, context) => {
  const json = await fetchCampaigns(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a paginated campaign collection.
 *
 * @return {Collection}
 */
export const getPaginatedCampaigns = async (args, context) => {
  const json = await fetchCampaigns(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch posts from Rogue.
 *
 * @return {Promise}
 */
export const fetchPosts = async (args, context, additionalQuery) => {
  const queryString = querify({
    pagination: 'cursor',
    filter: {
      action: args.action,
      action_id: args.actionIds ? args.actionIds.join(',') : undefined,
      campaign_id: args.campaignId,
      group_id: args.groupId,
      signup_id: args.signupId,
      location: args.location,
      northstar_id: args.userId,
      referrer_user_id: args.referrerUserId,
      source: args.source,
      status: args.status ? args.status.map(enumToString).join(',') : undefined,
      tag: args.tags ? args.tags.join(',') : undefined,
      type: args.type,
      volunteer_credit: args.volunteerCredit,
    },
    ...additionalQuery,
  });

  logger.debug('Loading posts from Rogue.', {
    args,
    queryString,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Fetch a paginated post collection.
 *
 * @return {Collection}
 */
export const getPaginatedPosts = async (args, context) => {
  const json = await fetchPosts(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch a list of posts.
 *
 * @return {Array}
 */
export const getPosts = async (args, context) => {
  const json = await fetchPosts(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a post from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getPostById = async (id, context) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch posts from Rogue for a given user.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsByUserId = async (id, page, count, context) => {
  const queryString = querify({
    filter: {
      northstar_id: id,
      type: 'photo,text',
    },
    page,
    limit: count,
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch posts from Rogue for a given campaign.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsByCampaignId = async (id, page, count, context) => {
  const queryString = querify({
    filter: {
      campaign_id: id,
      type: 'photo,text',
    },
    page,
    limit: count,
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch posts from Rogue for a given signup.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsBySignupId = async (id, context) => {
  const queryString = querify({
    filter: { signup_id: id },
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${queryString}`,
    authorizedRequest(context),
  );
  const json = await response.json();

  return transformCollection(json);
};

/**
 * Toggle a reaction on Rogue.
 *
 * @param {Number} postId
 * @return {Object}
 */
export const toggleReaction = async (postId, context) => {
  await fetch(`${ROGUE_URL}/api/v3/posts/${postId}/reactions`, {
    ...requireAuthorizedRequest(context),
    method: 'POST',
  });

  return getPostById(postId, context);
};

/**
 * Update a post's quantity.
 *
 * @param {Number} postId
 * @param {Number} quantity
 * @return {Object}
 */
export const updatePostQuantity = async (postId, quantity, context) => {
  const response = await fetch(`${ROGUE_URL}/api/v3/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
    ...requireAuthorizedRequest(context),
  });

  return transformItem(await response.json());
};

/**
 * Create a review for a post.
 *
 * @param {Number} postId
 * @param {String} status
 * @return {Object}
 */
export const reviewPost = async (postId, status, context) => {
  const response = await fetch(`${ROGUE_URL}/api/v3/posts/${postId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ status: status.toLowerCase() }),
    ...requireAuthorizedRequest(context),
  });

  return transformItem(await response.json());
};

/**
 * Add or remove a tag to a post.
 *
 * @param {Number} postId
 * @param {String} tag
 * @return {Object}
 */
export const tagPost = async (postId, tag, context) => {
  const response = await fetch(`${ROGUE_URL}/api/v3/posts/${postId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag_name: tag.toLowerCase() }),
    ...requireAuthorizedRequest(context),
  });

  return transformItem(await response.json());
};

/**
 * Rotate a post's image.
 *
 * @param {Number} postId
 * @param {Number} degrees
 * @return {Object}
 */
export const rotatePost = async (postId, degrees, context) => {
  const response = await fetch(`${ROGUE_URL}/api/v3/posts/${postId}/rotate`, {
    method: 'POST',
    body: JSON.stringify({ degrees }),
    ...requireAuthorizedRequest(context),
  });

  return transformItem(await response.json());
};

/**
 * Delete a post.
 *
 * @param {Number} postId
 * @return {Object}
 */
export const deletePost = async (postId, context) => {
  const post = await getPostById(postId, context);

  if (!post) {
    throw new Error(`Post with ID: ${postId} was not found.`);
  }

  const response = await fetch(`${ROGUE_URL}/api/v3/posts/${postId}`, {
    method: 'DELETE',
    ...requireAuthorizedRequest(context),
  });

  return response.status === 200
    ? { ...post, deleted: true }
    : { ...post, deleted: false };
};

/**
 * Get Rogue signup permalink by ID.
 *
 * @param {Number} id
 * @return {String}
 */
export const getPermalinkBySignupId = id => `${ROGUE_URL}/signups/${id}`;

/**
 * Get Rogue post permalink by ID.
 *
 * @param {Number} id
 * @return {String}
 */
export const getPermalinkByPostId = id => `${ROGUE_URL}/posts/${id}`;

/**
 * Create an impact statement from quantity, noun and verb
 *
 * @param {Object} post
 * @return {String}
 */
export const makeImpactStatement = post => {
  if (!post.quantity) {
    return null;
  }

  const { noun, verb } = post.actionDetails.data;
  const statement = pluralize(noun, post.quantity, true);

  return `${statement} ${verb}`;
};

/**
 * Fetch signups from Rogue.
 *
 * @param {String} campaignId
 * @param {Number} count
 * @param {Number} groupId
 * @param {Number} page
 * @param {String} orderBy
 * @param {String} source
 * @param {String} userId
 * @return {Array}
 */
export const fetchSignups = async (args, context, additionalQuery) => {
  const queryString = querify({
    filter: {
      campaign_id: args.campaignId,
      group_id: args.groupId,
      northstar_id: args.userId,
      referrer_user_id: args.referrerUserId,
      source: args.source,
    },
    orderBy: args.orderBy,
    pagination: 'cursor',
    ...additionalQuery,
  });

  logger.debug('Loading posts from Rogue.', {
    args,
    queryString,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Fetch a paginated signup collection.
 *
 * @return {Collection}
 */
export const getPaginatedSignups = async (args, context) => {
  const json = await fetchSignups(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch a list of signups.
 *
 * @return {Array}
 */
export const getSignups = async (args, context) => {
  const json = await fetchSignups(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a signup from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getSignupById = async (id, context) => {
  logger.debug('Loading signup from Rogue', {
    id,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${id}`,
    authorizedRequest(context),
  );
  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch signups from Rogue by ID.
 *
 * @param {Array} ids
 * @param {Object} options
 * @return {Array}
 */
export const getSignupsById = async (ids, options) => {
  logger.debug('Loading signups from Rogue', {
    ids,
  });

  const queryString = {
    filter: {
      ids: ids.join(','),
    },
    limit: 100,
    pagination: 'cursor',
  };

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${queryString}`,
    options,
  );

  const json = await response.json();
  const signups = transformCollection(json);

  // Return signups in the same format requested. <https://git.io/fjLrM>
  return ids.map(id => find(signups, ['id', id], null));
};

/**
 * Fetch signups from Rogue by User ID.
 *
 * @param {String} id
 * @param {Number} count
 * @param {Number} page
 * @param {String} orderBy
 * @return {Array}
 */
export const getSignupsByUserId = async (args, context) => {
  const queryString = querify({
    filter: {
      northstar_id: args.id,
    },
    orderBy: args.orderBy,
    page: args.page,
    limit: args.count,
    pagination: 'cursor',
  });

  logger.debug('Loading signups from Rogue.', {
    args,
    queryString,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Create a signup.
 *
 * @param {Number} signupId
 * @return {Object}
 */
export const createSignup = async (args, context) => {
  if (!args.campaignId) {
    throw new Error(`Cannot create a signup without 'campaignId'.`);
  }

  logger.debug('Creating a signup', { args });

  const response = await fetch(`${ROGUE_URL}/api/v3/signups`, {
    method: 'POST',
    ...requireAuthorizedRequest(context),
    body: JSON.stringify({
      campaign_id: args.campaignId,
      details: args.details,
    }),
  });

  const json = await response.json();

  return transformItem(json);
};

/**
 * Delete a signup.
 *
 * @param {Number} signupId
 * @return {Object}
 */
export const deleteSignup = async (signupId, context) => {
  const signup = await getSignupById(signupId, context);

  const response = await fetch(`${ROGUE_URL}/api/v3/signups/${signupId}`, {
    method: 'DELETE',
    ...requireAuthorizedRequest(context),
  });

  return response.status === 200
    ? { ...signup, deleted: true }
    : { ...signup, deleted: false };
};

/**
 * Fetch number of signups from Rogue based on the given filters.
 * NOTE: This will only find the number of signups up to the "limit" provided.
 * The limit defaults to 20.
 *
 * @param {String} campaignId
 * @param {Number} limit
 * @param {String} source
 * @param {String} userId
 * @return Int
 */
export const getSignupsCount = async (args, context) => {
  const queryString = querify({
    filter: {
      campaign_id: args.campaignId,
      northstar_id: args.userId,
      source: args.source,
    },
    limit: args.limit,
  });

  logger.debug('Loading signups count from Rogue.', {
    args,
    queryString,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  const result = await transformCollection(json);

  return result.length;
};

/**
 * Fetch number of posts from Rogue based on the given filters.
 * NOTE: This will only find the number of posts up to the "limit" provided.
 * The limit defaults to 20.
 *
 * @param {String} action
 * @param {String} actionIds
 * @param {String} campaignId
 * @param {Number} groupId
 * @param {Number} limit
 * @param {String} location
 * @param {String} source
 * @param {String} type
 * @param {String} userId
 * @param {String} tags
 * @return Int
 */
export const getPostsCount = async (args, context) => {
  const queryString = querify({
    filter: {
      action: args.action,
      action_id: args.actionIds ? args.actionIds.join(',') : undefined,
      campaign_id: args.campaignId,
      group_id: args.groupId,
      location: args.location,
      northstar_id: args.userId,
      referrer_user_id: args.referrerUserId,
      source: args.source,
      status: args.status ? args.status.map(enumToString).join(',') : undefined,
      type: args.type,
      tag: args.tags,
    },
    limit: args.limit,
  });

  logger.debug('Loading posts count from Rogue.', {
    args,
    queryString,
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  const result = transformCollection(json);

  return result.length;
};

/**
 * Fetch number of completed voter-reg posts for given groupId.
 *
 * @param {Number} groupId
 * @return Int
 */
export const getVoterRegistrationsCountByGroupId = async (groupId, context) => {
  return getPostsCount(
    {
      groupId,
      limit: 50,
      status: ['register-form', 'register-ovr'],
      type: 'voter-reg',
    },
    context,
  );
};

/**
 * Fetch number of completed voter-reg posts for given referrerUserId.
 *
 * @param {String} referrerUserId
 * @return Int
 */
export const getVoterRegistrationsCountByReferrerUserId = async (
  referrerUserId,
  context,
) => {
  return getPostsCount(
    {
      referrerUserId,
      limit: 50,
      status: ['register-form', 'register-ovr'],
      type: 'voter-reg',
    },
    context,
  );
};

/**
 * Parse `Cause` type from a given campaign.
 *
 * @param {Object} campaign
 */
export const parseCampaignCauses = campaign => {
  // These are provided as two separate ordered arrays
  // from Rogue's Campaigns API. We'll zip them together.
  const { cause, causeNames } = campaign;

  // Some campaigns have badly-formatted data...
  if (cause.length !== causeNames.length) {
    logger.warn('Misformated campaign causes', {
      id: campaign.id,
      cause,
      causeNames,
    });

    return [];
  }

  return zipWith(cause, causeNames, (id, name) => ({ id, name }));
};

/**
 * Fetch a group by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getGroupById = async (id, context) => {
  logger.debug('Loading group from Rogue', { id });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/groups/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch groups from Rogue based on the given filters.
 *
 * @param {Number} groupTypeId
 * @param {String} location
 * @param {String} name
 * @param {String} schoolId
 * @return {Array}
 */
export const fetchGroups = async (args, context, additionalQuery) => {
  const queryString = querify({
    pagination: 'cursor',
    filter: {
      group_type_id: args.groupTypeId,
      location: args.location,
      name: args.name,
      school_id: args.schoolId,
    },
    ...additionalQuery,
  });

  logger.info('Loading groups from Rogue', { args, queryString });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/groups/${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Get a simple list of groups.
 *
 * @return {Array}
 */
export const getGroups = async (args, context) => {
  const json = await fetchGroups(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a paginated group collection.
 *
 * @return {Collection}
 */
export const getPaginatedGroups = async (args, context) => {
  const json = await fetchGroups(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch a group type by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getGroupTypeById = async (id, context) => {
  logger.debug('Loading group type from Rogue', { id });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/group-types/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};

/**
 * Get a simple list of group types.
 *
 * @return {Array}
 */
export const getGroupTypes = async (args, context) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/group-types`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch clubs from Rogue based on the given filters.
 *
 * @param {String} args.name
 * @return {Array}
 */
export const fetchClubs = async (args, context, additionalQuery) => {
  const queryString = querify({
    filter: {
      name: args.name,
    },
    pagination: 'cursor',
    ...additionalQuery,
  });

  logger.info(' Loading clubs from Rogue', { args, queryString });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/clubs${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Fetch clubs from Rogue based on the given filters.
 *
 * @param {Number} args.count
 * @param {Number} args.page
 * @return {Array}
 */
export const getClubs = async (args, context) => {
  const json = await fetchClubs(args, context, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a paginated clubs collection.
 *
 * @param {Number} args.first
 * @param {Number} args.after
 * @return {Collection}
 */
export const getPaginatedClubs = async (args, context) => {
  const json = await fetchClubs(args, context, {
    limit: args.first,
    cursor: {
      after: args.after,
    },
  });

  return new Collection(json);
};

/**
 * Fetch a club from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getClubById = async (id, context) => {
  logger.debug('Loading club from Rogue', { id });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/clubs/${id}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformItem(json);
};
