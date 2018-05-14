import { set } from 'lodash';
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
    const error = exception.message;
    logger.warn('Unable to load user.', { id, error, options });
  }

  return null;
};

/**
 * Northstar data loader.
 *
 * @var {Northstar}
 */
const Northstar = context => {
  // If this is a new GraphQL request, configure a loader.
  if (!context.northstar) {
    logger.debug('Creating a new loader for Northstar.');
    const options = authorizedRequest(context);
    set(context, 'northstar', {
      users: new DataLoader(ids =>
        Promise.all(ids.map(id => getUserById(id, options))),
      ),
    });
  }

  return context.northstar;
};

export default Northstar;
