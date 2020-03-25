import { stringify } from 'qs';
import pluralize from 'pluralize';
import logger from 'heroku-logger';
import { getFields } from 'fielddataloader';
import {
  find,
  intersection,
  isUndefined,
  omit,
  snakeCase,
  zipWith,
} from 'lodash';

import schema from '../schema';
import config from '../../config';
import Collection from './Collection';
import {
  getOptional,
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

  const response = await fetch(
    `${ROGUE_URL}/api/v3/actions/?filter[campaign_id]=${campaignId}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Get a simple list of action stats by school and or action ID.
 * @TODO: We'll eventually need to support pagination as more action collect school ID's.
 *
 * @param {String} school_id
 * @param {Number} action_id
 * @param {String} orderBy
 * @return {Array}
 */
export const getActionStats = async (schoolId, actionId, orderBy, context) => {
  logger.debug('Loading action-stats from Rogue', {
    schoolId,
    actionId,
  });

  const filter = {};

  if (actionId) {
    filter.action_id = actionId;
  }
  if (schoolId) {
    filter.school_id = schoolId;
  }

  const queryString = stringify({
    filter,
    orderBy,
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/action-stats/?${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch a campaign from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getCampaignById = async (id, fields, context) => {
  logger.debug('Loading campaign from Rogue', { id });

  // Rogue expects a comma-separated list of snake_case fields.
  // If not querying anything, use 'undefined' to omit query string.
  const optionalFields = intersection(fields, getOptional(schema, 'Campaign'));
  const include = optionalFields.length
    ? optionalFields.map(snakeCase).join()
    : undefined;

  const queryString = { include };

  const response = await fetch(
    `${ROGUE_URL}/api/v3/campaigns/${id}?${queryString}`,
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
 * @return {Array}
 */
export const fetchCampaigns = async (
  args,
  context,
  info,
  additionalQuery = {},
) => {
  const filter = omit(
    {
      is_open: args.isOpen,
      cause: args.causes ? args.causes.join(',') : undefined,
      has_website: args.hasWebsite,
    },
    isUndefined,
  );

  // Rogue expects a comma-separated list of snake_case fields.
  // If not querying anything, use 'undefined' to omit query string.
  const fields = getFields(info, 'Campaign', 'edges.node');
  const optionalFields = intersection(fields, getOptional(schema, 'Campaign'));
  const include = optionalFields.length
    ? optionalFields.map(snakeCase).join()
    : undefined;

  const queryString = stringify({
    filter,
    orderBy: args.orderBy,
    pagination: 'cursor',
    include,
    ...additionalQuery,
  });

  logger.info('Loading campaigns from Rogue', { queryString });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/campaigns/?${queryString}`,
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
export const getCampaigns = async (args, context, info) => {
  const json = await fetchCampaigns(args, context, info, {
    limit: args.count,
    page: args.page,
  });

  return transformCollection(json);
};

/**
 * Fetch a paginated campaign connection.
 *
 * @return {Collection}
 */
export const getPaginatedCampaigns = async (args, context, info) => {
  const json = await fetchCampaigns(args, context, info, {
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
  const queryString = stringify({
    pagination: 'cursor',
    filter: {
      action: args.action,
      action_id: args.actionIds ? args.actionIds.join(',') : undefined,
      campaign_id: args.campaignId,
      signup_id: args.signupId,
      location: args.location,
      northstar_id: args.userId,
      source: args.source,
      status: args.status,
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
    `${ROGUE_URL}/api/v3/posts/?${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Fetch a paginated post connection.
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
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?filter[northstar_id]=${id}&filter[type]=photo,text&page=${page}&limit=${count}&pagination=cursor`,
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
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?filter[campaign_id]=${id}&filter[type]=photo,text&page=${page}&limit=${count}&pagination=cursor`,
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
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?filter[signup_id]=${id}&pagination=cursor`,
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
  const { noun, verb } = post.actionDetails.data;
  const statement = pluralize(noun, post.quantity, true);

  return `${statement} ${verb}`;
};

/**
 * Fetch signups from Rogue.
 *
 * @param {String} campaignId
 * @param {Number} count
 * @param {Number} page
 * @param {String} orderBy
 * @param {String} source
 * @param {String} userId
 * @return {Array}
 */
export const fetchSignups = async (args, context, additionalQuery) => {
  const queryString = stringify({
    filter: {
      campaign_id: args.campaignId,
      northstar_id: args.userId,
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
    `${ROGUE_URL}/api/v3/signups/?${queryString}`,
    authorizedRequest(context),
  );

  return response.json();
};

/**
 * Fetch a paginated signup connection.
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

  const idQuery = ids.join(',');
  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?filter[id]=${idQuery}&limit=100&pagination=cursor`,
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
 * @return {Array}
 */
export const getSignupsByUserId = async (args, context) => {
  const queryString = stringify({
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
    `${ROGUE_URL}/api/v3/signups/?${queryString}`,
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
  const queryString = stringify({
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
    `${ROGUE_URL}/api/v3/signups/?${queryString}`,
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
 * @param {Number} limit
 * @param {String} location
 * @param {String} source
 * @param {String} type
 * @param {String} userId
 * @param {String} tags
 * @return Int
 */
export const getPostsCount = async (args, context) => {
  const queryString = stringify({
    filter: {
      action: args.action,
      action_id: args.actionIds ? args.actionIds.join(',') : undefined,
      campaign_id: args.campaignId,
      location: args.location,
      northstar_id: args.userId,
      referrer_user_id: args.referrerUserId,
      source: args.source,
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
    `${ROGUE_URL}/api/v3/posts/?${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  const result = transformCollection(json);

  return result.length;
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
