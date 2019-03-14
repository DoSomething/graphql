import OEmbetter from 'oembetter';
import logger from 'heroku-logger';

import Cache from '../cache';
import config from '../../config';
import { transformResponse } from './helpers';

const embedClient = OEmbetter();
const cache = new Cache(config('embeds.cache'));
embedClient.whitelist(config('embeds.whitelist'));

// Promisify the 'Oembetter.fetch' API:
async function fetchOEmbed(url) {
  return new Promise((resolve, reject) => {
    embedClient.fetch(url, (err, response) => {
      if (err) {
        reject(err);
      }

      resolve(response);
    });
  });
}

/**
 * Fetch a campaign from Rogue by ID.
 *
 * @param {Number} id
 * @return {Object}
 */
export const getEmbed = async url => {
  logger.debug('Loading embed', { url });

  try {
    const cachedEntry = await cache.get(url);

    if (cachedEntry) {
      logger.debug('Cache hit for embed', { url });
      return cachedEntry;
    }

    const response = await fetchOEmbed(url);
    const embed = transformResponse(response, 'version');
    console.log('embed', { embed });

    logger.debug('Cache miss for embed', { url });
    cache.set(url, embed);

    return embed;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load embed.', {
      url,
      error,
    });
  }

  return null;
};

export default null;
