import logger from 'heroku-logger';

import config from '../../config';
import { transformItem } from './helpers';

const NORTHSTAR_URL = config('services.northstar.url');

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
export const getUserById = async (id, options) => {
  logger.debug('Loading user from Northstar', { id });
  try {
    const response = await fetch(`${NORTHSTAR_URL}/v2/users/${id}`, options);
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load user.', { id, error, options });
  }

  return null;
};

export default null;
