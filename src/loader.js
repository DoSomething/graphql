import { set } from 'lodash';
import logger from 'heroku-logger';
import DataLoader from 'dataloader';

import { getEmbed } from './repositories/embed';
import {
  getActionById,
  getCampaignById,
  getSignupsById,
} from './repositories/rogue';
import { getUserById } from './repositories/northstar';
import { getConversationById } from './repositories/gambit';
import { getGambitContentfulEntryById } from './repositories/contentful/gambit';
import { authorizedRequest } from './repositories/helpers';
import {
  getPhoenixContentfulAssetById,
  getPhoenixContentfulEntryById,
} from './repositories/contentful/phoenix';

/**
 * The data loader handles batching and caching the backend
 * requests needed for a single GraphQL query.
 *
 * @var {DataLoader}
 */
export default (context, preview = false) => {
  // Keep track of whether or not we're in "preview" mode:
  if (preview) {
    set(context, 'preview', true);
  }

  // If this is a new GraphQL request, configure a loader.
  if (!context.loader) {
    logger.debug('Creating a new loader for this GraphQL request.');
    const options = authorizedRequest(context);

    set(context, 'loader', {
      actions: new DataLoader(ids =>
        Promise.all(ids.map(id => getActionById(id, options))),
      ),
      assets: new DataLoader(ids =>
        Promise.all(ids.map(id => getPhoenixContentfulAssetById(id, context))),
      ),
      blocks: new DataLoader(ids =>
        Promise.all(ids.map(id => getPhoenixContentfulEntryById(id, context))),
      ),
      broadcasts: new DataLoader(ids =>
        Promise.all(ids.map(id => getGambitContentfulEntryById(id, options))),
      ),
      campaigns: new DataLoader(ids =>
        Promise.all(ids.map(id => getCampaignById(id, options))),
      ),
      conversations: new DataLoader(ids =>
        Promise.all(ids.map(id => getConversationById(id, options))),
      ),
      embeds: new DataLoader(urls =>
        Promise.all(urls.map(url => getEmbed(url))),
      ),
      users: new DataLoader(ids =>
        Promise.all(ids.map(id => getUserById(id, options))),
      ),
      signups: new DataLoader(ids => getSignupsById(ids, options)),
      topics: new DataLoader(ids =>
        Promise.all(ids.map(id => getGambitContentfulEntryById(id, options))),
      ),
    });
  }

  return context.loader;
};
