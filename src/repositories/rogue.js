import logger from 'heroku-logger';
import { stringify } from 'qs';

import config from '../../config';
import {
  transformItem,
  transformCollection,
  authorizedRequest,
  requireAuthorizedRequest,
} from './helpers';

const ROGUE_URL = config('services.rogue.url');

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
 * @return {Array}
 */
export const getCampaigns = async (args, context) => {
  const queryString = stringify({
    page: args.page,
    limit: args.count,
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/campaigns/?${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch posts from Rogue.
 *
 * @param {String} action
 * @param {String} actionIds
 * @param {String} campaignId
 * @param {Number} count
 * @param {Number} page
 * @param {String} source
 * @param {String} type
 * @param {String} userId
 * @return {Array}
 */
export const getPosts = async (args, context) => {
  const queryString = stringify({
    filter: {
      action: args.action,
      action_id: args.actionIds ? args.actionIds.join(',') : undefined,
      campaign_id: args.campaignId,
      northstar_id: args.userId,
      source: args.source,
      type: args.type,
    },
    page: args.page,
    limit: args.count,
    pagination: 'cursor',
  });

  logger.debug('Loading posts from Rogue.', { args, queryString });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

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
    `${ROGUE_URL}/api/v3/posts/?filter[northstar_id]=${
      id
    }&filter[type]=photo,text&page=${page}&limit=${count}&pagination=cursor`,
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
    `${ROGUE_URL}/api/v3/posts/?filter[campaign_id]=${
      id
    }&filter[type]=photo,text&page=${page}&limit=${count}&pagination=cursor`,
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
 * Get Rogue signup permalink by ID.
 *
 * @param {Number} id
 * @return {String}
 */
export const getPermalinkBySignupId = id => `${ROGUE_URL}/signups/${id}`;

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
export const getSignups = async (args, context) => {
  const queryString = stringify({
    filter: {
      campaign_id: args.campaignId,
      northstar_id: args.userId,
      source: args.source,
    },
    orderBy: args.orderBy,
    page: args.page,
    limit: args.count,
    pagination: 'cursor',
  });

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?${queryString}`,
    authorizedRequest(context),
  );
  const json = await response.json();

  return transformCollection(json);
};

/**
 * Fetch a signup from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getSignupById = async (id, context) => {
  logger.debug('Loading signup from Rogue', { id });

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
  logger.debug('Loading signups from Rogue', { ids });

  const idQuery = ids.join(',');
  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?filter[id]=${
      idQuery
    }&limit=100&pagination=cursor`,
    options,
  );
  const json = await response.json();

  return transformCollection(json);
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

  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?${queryString}`,
    authorizedRequest(context),
  );

  const json = await response.json();

  return transformCollection(json);
};
