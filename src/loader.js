import { set } from 'lodash';
import logger from 'heroku-logger';
import DataLoader from 'dataloader';

import { getSignupsById } from './repositories/rogue';
import { getUserById } from './repositories/northstar';
import { authorizedRequest } from './repositories/helpers';

/**
 * The data loader handles batching and caching the backend
 * requests needed for a single GraphQL query.
 *
 * @var {DataLoader}
 */
export default context => {
  // If this is a new GraphQL request, configure a loader.
  if (!context.loader) {
    logger.debug('Creating a new loader for this GraphQL request.');
    const options = authorizedRequest(context);
    set(context, 'loader', {
      users: new DataLoader(ids =>
        Promise.all(ids.map(id => getUserById(id, options))),
      ),
      signups: new DataLoader(ids => getSignupsById(ids, options)),
    });
  }

  return context.loader;
};