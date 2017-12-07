import DataLoader from 'dataloader';
import config from '../../config';
import {
  transformItem,
  transformCollection,
  authorizedRequest,
} from './helpers';

const ROGUE_URL = config('services.rogue.url');

/**
 * Fetch posts from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getPosts = async (page, count, context) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?page=${page}&limit=${count}`,
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

  return transformCollection(json);
};

/**
 * Fetch posts from Rogue for a given user.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsByUserId = async (id, page, count, context) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/posts/?filter[northstar_id]=${id}&page=${page}&limit=${
      count
    }`,
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
    `${ROGUE_URL}/api/v3/posts/?filter[signup_id]=${id}`,
    authorizedRequest(context),
  );
  const json = await response.json();

  return transformCollection(json);
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
    `${ROGUE_URL}/api/v3/signups/?page=${page}&limit=${count}`,
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
const getSignupsById = async (ids, options) => {
  const response = await fetch(
    `${ROGUE_URL}/api/v3/signups/?filter[id]=${ids.join(',')}&limit=100`,
    options,
  );
  const json = await response.json();

  return transformCollection(json);
};

/**
 * Rogue data loader.
 *
 * @var {Northstar}
 */
let instance = null;
const Rogue = context => {
  if (instance) return instance;

  // Configure a new loader for the request.
  const options = authorizedRequest(context);

  instance = {
    signups: new DataLoader(ids => getSignupsById(ids, options)),
  };

  return instance;
};

export default Rogue;
