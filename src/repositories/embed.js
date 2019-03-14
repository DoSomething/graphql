import { createWindow } from 'domino';
import OEmbetter from 'oembetter';
import logger from 'heroku-logger';
import { getMetadata } from 'page-metadata-parser';
import { promisify } from 'util';
import { URL } from 'url';

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
  const { hostname } = new URL(url);

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
const fetchOEmbed = promisify(embedClient.fetch);

/**
 * Fetch an embed.
 *
 * @param {String} url
 * @return {Object}
 */
export const getEmbed = async url => {
  try {
    // Ignore query strings for better cacheability.
    const urlObject = new URL(url);
    urlObject.search = '';

    const { href } = urlObject;

    logger.debug('Loading embed', { href });
    const cachedEntry = await cache.get(href);

    if (cachedEntry) {
      logger.debug('Cache hit for embed', { href });
      return cachedEntry;
    }

    const response = await fetchOEmbed(href);
    const embed = transformResponse(response, 'version');
    console.log('embed', { embed });

    logger.debug('Cache miss for embed', { href });
    cache.set(url, embed);

    return embed;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load embed.', { rawUrl, error });
  }

  return null;
};

export default null;
