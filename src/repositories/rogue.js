import { transformItem, transformCollection } from './helpers';

const { ROGUE_URL } = process.env;

/**
 * Fetch posts from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getPosts = (page, count) => {
  return fetch(`${ROGUE_URL}/api/v3/posts/?page=${page}&limit=${count}`)
    .then(response => response.json())
    .then(json => transformCollection(json));
}

/**
 * Fetch a post from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getPostById = (id) => {
  return fetch(`${ROGUE_URL}/api/v3/posts/${id}`)
    .then(response => response.json())
    .then(json => transformItem(json));
}

/**
 * Fetch posts from Rogue for a given user.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsByUserId = (id, page, count) => {
  return fetch(`${ROGUE_URL}/api/v3/posts/?filter[northstar_id]=${id}&page=${page}&limit=${count}`)
    .then(response => response.json())
    .then(json => transformCollection(json));
}

/**
 * Fetch posts from Rogue for a given signup.
 *
 * @param {String} id
 * @return {Array}
 */
export const getPostsBySignupId = (id) => {
  return fetch(`${ROGUE_URL}/api/v3/posts/?filter[signup_id]=${id}`)
    .then(response => response.json())
    .then(json => transformCollection(json));
}

/**
 * Fetch signups from Rogue.
 *
 * @param {Number} page
 * @param {Number} count
 * @return {Array}
 */
export const getSignups = (page, count) => {
  return fetch(`${ROGUE_URL}/api/v3/signups/?page=${page}&limit=${count}`)
    .then(response => response.json())
    .then(json => transformCollection(json));
}

/**
 * Fetch a signup from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getSignupById = (id) => {
  return fetch(`${ROGUE_URL}/api/v3/signups/${id}`)
    .then(response => response.json())
    .then(json => transformItem(json));
}
