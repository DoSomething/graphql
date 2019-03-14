import { createWindow } from 'domino';
import OEmbetter from 'oembetter';
import logger from 'heroku-logger';
import { getMetadata } from 'page-metadata-parser';
import { parse } from 'url';

import Cache from '../cache';
import config from '../../config';
import { transformResponse } from './helpers';

const embedClient = OEmbetter();
const cache = new Cache(config('embed.cache'));

// Configure whitelisted domains & custom mappings. <https://git.io/fjeVb>
embedClient.whitelist(config('embed.whitelist'));
embedClient.endpoints(embedClient.suggestedEndpoints);

// For sites where we don't support OEmbed, try OpenGraph/Twitter metatags:
embedClient.addBefore(async (url, options, _, callback) => {
  const { hostname } = parse(url);

  // We only prefer to fetch metatags for some domains:
  const metatagDomains = config('embed.preferMetatags');
  if (!metatagDomains.some(domain => embedClient.inDomain(domain, hostname))) {
    return callback(null);
  }

  const response = await fetch(url);
  if (!response) {
    return callback(null);
  }

  const { document } = createWindow(await response.text());
  const metadata = getMetadata(document, url);
  if (!metadata) {
    return callback(null);
  }

  return callback(null, url, options, {
    version: '1.0',
    type: 'link',
    title: metadata.title,
    providerName: metadata.provider,
    thumbnailUrl: metadata.image,
    description: metadata.description,
  });
});

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
    logger.warn('Unable to load embed.', { url, error });
  }

  return null;
};

export default null;
