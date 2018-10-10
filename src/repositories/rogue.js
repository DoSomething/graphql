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
 * Fetch posts from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getPosts = async (args, context) => {
  const queryString = stringify({
    filter: {
      action: args.action,
      campaign_id: args.campaignId,
      northstar_id: args.userId,
      type: args.type,
    },
    page: args.page,
    limit: args.count,
    pagination: 'cursor',
  });

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
 * Fetch signups from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getSignups = async (page, count, context) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?page=${page}&limit=${
      count
    }&pagination=cursor`,
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
  console.log(`loading a signup: ${id}`);
  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/${id}`,
    authorizedRequest(context),
  );
  const json = await response.json();

  return transformItem(json);
};

/**
 * Fetch signups from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
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
