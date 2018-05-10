import logger from 'heroku-logger';
import DataLoader from 'dataloader';

import config from '../../config';
import { authorizedRequest, transformItem } from './helpers';

const NORTHSTAR_URL = config('services.northstar.url');

/**
 * Fetch a user from Northstar by ID.
 *
 * @return {Object}
 */
const getUserById = async (id, options) => {
  logger.debug('Loading user from Northstar', { id });
  try {
    const response = await fetch(`${NORTHSTAR_URL}/v1/users/id/${id}`, options);
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    logger.warn('Unable to load user.', { id, options });
  }
};

/**
 * Northstar data loader.
 *
 * @var {Northstar}
 */
let instance = null;
const Northstar = context => {
  if (instance) return instance;

  // Configure a new loader for the request.
  const options = authorizedRequest(context);

  instance = {
    users: new DataLoader(ids =>
      Promise.all(ids.map(id => getUserById(id, options))),
    ),
  };

  return instance;
};

export default Northstar;
