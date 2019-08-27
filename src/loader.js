import { get, set } from 'lodash';
import logger from 'heroku-logger';
import DataLoader from 'dataloader';

import { getEmbed } from './repositories/embed';
import {
  getActionById,
  getCampaignById,
  getSignupsById,
} from './repositories/rogue';
// import { getUsersById } from './repositories/northstar';
import { getConversationById } from './repositories/gambit';
import {
  getGambitContentfulEntryById,
  getGambitContentfulAssetById,
} from './repositories/contentful/gambit';
import { authorizedRequest } from './repositories/helpers';
import {
  getPhoenixContentfulAssetById,
  getPhoenixContentfulEntryById,
  getAffiliateByUtmLabel,
  getCampaignWebsiteByCampaignId,
} from './repositories/contentful/phoenix';
import { getUserById } from './repositories/northstar';

/**
 * The data loader handles batching and caching the backend
 * requests needed for a single GraphQL query.
 *
 * @var {DataLoader}
 */
const Loader = (context, preview = false) => {
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
      affiliates: new DataLoader(utmLabels =>
        Promise.all(
          utmLabels.map(utmLabel => getAffiliateByUtmLabel(utmLabel, context)),
        ),
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
      campaignWebsites: new DataLoader(ids =>
        Promise.all(ids.map(id => getPhoenixContentfulEntryById(id, context))),
      ),
      campaignWebsiteByCampaignIds: new DataLoader(campaignIds =>
        Promise.all(
          campaignIds.map(campaignId =>
            getCampaignWebsiteByCampaignId(campaignId, context),
          ),
        ),
      ),
      conversations: new DataLoader(ids =>
        Promise.all(ids.map(id => getConversationById(id, options))),
      ),
      embeds: new DataLoader(urls =>
        Promise.all(urls.map(url => getEmbed(url))),
      ),
      gambitAssets: new DataLoader(ids =>
        Promise.all(ids.map(id => getGambitContentfulAssetById(id, context))),
      ),
      users: new DataLoader(ids =>
        Promise.resolve(
          ids.map(
            id =>
              new DataLoader(async fields => {
                const result = await getUserById(id, fields, options);
                const values = fields.map(field => get(result, field));

                return Promise.resolve(values);
              }),
          ),
        ),
      ),
      signups: new DataLoader(ids => getSignupsById(ids, options)),
      topics: new DataLoader(ids =>
        Promise.all(ids.map(id => getGambitContentfulEntryById(id, options))),
      ),
    });
  }

  return context.loader;
};

export default Loader;
