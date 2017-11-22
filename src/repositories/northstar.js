import { transformItem } from './helpers';

const { NORTHSTAR_URL } = process.env;

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = (id) => {
  return fetch(`${NORTHSTAR_URL}/v1/users/id/${id}`)
    .then(response => response.json())
    .then(json => transformItem(json));
}
