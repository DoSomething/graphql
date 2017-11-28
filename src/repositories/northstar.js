import { authorizedRequest, transformItem } from './helpers';

const { NORTHSTAR_URL } = process.env;

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = async (id, context) => {
  const response = await fetch(`${NORTHSTAR_URL}/v1/users/id/${id}`, authorizedRequest(context))
  const json = await response.json();

  // @TODO: Throw if we got an exception.

  return transformItem(json);
}
