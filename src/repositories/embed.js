import { URL } from 'url';
import OEmbetter from 'oembetter';
import logger from 'heroku-logger';
import { createWindow } from 'domino';
import { getMetadata } from 'page-metadata-parser';

import config from '../../config';
import Cache, { ONE_HOUR } from '../cache';
import { transformResponse } from '../shared/helpers/transformers';

const embedClient = OEmbetter();

// Configure embed cache (for one hour).
const cache = new Cache('embed', ONE_HOUR);

// Configure custom endpoint mappings. <https://git.io/fjeXT>
embedClient.endpoints(embedClient.suggestedEndpoints);

/**
 * Do we support OEmbed for the given URL?
 *
 * @param {*} url
 */
const supportsOEmbed = url =>
  config('embed.whitelist').some(domain =>
    embedClient.inDomain(domain, new URL(url).hostname),
  );

/**
 * Fetch OEmbed for a given URL.
 *
 * @param {String} url
 */
const fetchOEmbed = url =>
  new Promise(resolve => {
    if (!supportsOEmbed(url)) {
      return resolve(null);
    }

    return embedClient.fetch(url, (err, result) => {
      if (err) {
        logger.warn(`Unable to load OEmbed.`, { url, error: err.message });
        return resolve(null);
      }

      return resolve(result);
    });
  });

/**
 * Fetch OpenGraph/Twitter metadata for a given URL.
 *
 * @param {String} url
 */
const fetchMetadata = async url => {
  logger.debug('Fetching OpenGraph/Twitter metadata.', { url });
  const response = await fetch(url);
  if (!response) {
    return null;
  }

  const { document } = createWindow(await response.text());
  const metadata = getMetadata(document, url);
  if (!metadata) {
    return null;
  }

  return {
    version: '1.0',
    type: 'link',
    title: metadata.title,
    providerName: metadata.provider,
    thumbnailUrl: metadata.image,
    description: metadata.description,
  };
};

/**
 * Fetch an embed.
 *
 * @param {String} url
 * @return {Object}
 */
export const getEmbed = async url => {
  try {
    const href = new URL(url).href;
    const cachedEntry = await cache.get(href);

    if (cachedEntry) {
      logger.debug('Cache hit for embed', { href });
      return cachedEntry;
    }

    // Try to fetch OEmbed, or fallback to metadata:
    logger.debug('Cache miss for embed', { href });
    let response = await fetchOEmbed(href);
    if (!response) {
      response = await fetchMetadata(href);
    }

    // Validate and cache the embed for future queries:
    const embed = transformResponse(response, 'version');

    // Avoid caching faulty Youtube embed responses so we can try again in the next request.
    // (https://www.pivotaltracker.com/story/show/171091273/comments/214274074).
    if (
      new URL(url).hostname.match(/^((www\.)?youtube\.com|youtu\.be)$/) &&
      !embed.html
    ) {
      return embed;
    }

    cache.set(url, embed);

    return embed;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load embed.', { url, error });
  }

  return null;
};

export default null;
