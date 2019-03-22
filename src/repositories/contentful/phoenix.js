import { createClient } from 'contentful';
import logger from 'heroku-logger';
import { URL } from 'url';

import { urlWithQuery } from '../helpers';
import config from '../../../config';
import Loader from '../../loader';
import Cache from '../../cache';

const cache = new Cache(config('services.contentful.phoenix.cache'));

const contentfulClient = createClient({
  space: config('services.contentful.phoenix.spaceId'),
  accessToken: config('services.contentful.phoenix.accessToken'),
  environment: config('services.contentful.phoenix.environment'),
  resolveLinks: false,
});

/**
 * @param {Object} json
 * @return {Object}
 */
const transformItem = json => ({
  id: json.sys.id,
  contentType: json.sys.contentType.sys.id,
  createdAt: json.sys.createdAt,
  updatedAt: json.sys.updatedAt,
  ...json.fields,
});

/**
 * @param {Object} json
 * @return {Object}
 */
const transformAsset = json => ({
  id: json.sys.id,
  createdAt: json.sys.createdAt,
  updatedAt: json.sys.updatedAt,
  ...json.fields,
});

/**
 * Fetch a Phoenix Contentful entry by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getPhoenixContentfulEntryById = async id => {
  logger.debug('Loading Phoenix Contentful entry', { id });

  try {
    const cachedEntry = await cache.get(id);

    if (cachedEntry) {
      logger.debug('Cache hit for Phoenix Contentful entry', { id });
      return cachedEntry;
    }

    logger.debug('Cache miss for Phoenix Contentful entry', { id });

    const json = await contentfulClient.getEntry(id);
    const data = transformItem(json);
    cache.set(id, data);

    return data;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load Phoenix Contentful entry.', { id, error });
  }

  return null;
};

/**
 * Fetch a Phoenix Contentful entry by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getPhoenixContentfulAssetById = async id => {
  logger.debug('Loading Phoenix Contentful asset', { id });

  try {
    const cachedEntry = await cache.get(id);

    if (cachedEntry) {
      logger.debug('Cache hit for Phoenix Contentful asset', { id });
      return cachedEntry;
    }

    logger.debug('Cache miss for Phoenix Contentful asset', { id });

    const json = await contentfulClient.getAsset(id);
    const data = transformAsset(json);
    cache.set(id, data);

    return data;
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load Phoenix Contentful asset.', { id, error });
  }

  return null;
};

/**
 * Resolve a entry or asset from the "link" provided
 * in a Contentful response.
 *
 * @param {Object} entry
 * @param {Object} context
 * @param {Object} info
 */
export const linkResolver = (entry, _, context, info) => {
  const { fieldName, parentType } = info;
  const link = entry[fieldName];

  if (!link) {
    return null;
  }

  const { linkType, id } = link.sys;
  logger.debug(`Resolving link on ${parentType.name}.${fieldName}`, { id });

  switch (linkType) {
    case 'Asset':
      return Loader(context).assets.load(id);
    case 'Entry':
      return Loader(context).blocks.load(id);
    default:
      throw new Error('Unsupported link type.');
  }
};

/**
 * Given a Contentful asset, create a URL using Contentful's
 * Image API and the given field arguments.
 *
 * @param {Object} asset
 * @param {Object} args
 * @return {String}
 */
export const createImageUrl = (asset, args) => {
  const path = asset.file.url;
  if (!path) {
    return null;
  }

  // If we're provided a protocol-relative URL (from Contentful), normalize
  // it to HTTPS so that the URL() constructor doesn't pout at us.
  const absoluteUrl = path.startsWith('//') ? `https:${path}` : path;
  const url = new URL(absoluteUrl);

  // If this isn't using the Images API, don't try to transform:
  if (url.hostname !== 'images.ctfassets.net') {
    return url;
  }

  // If using a supported resize behavior, focus on any
  // faces found in the photo. Otherwise, center it.
  let focus = 'center';
  if (['PAD', 'FILL', 'CROP', 'THUMB'].includes(args.fit)) {
    focus = 'faces';
  }

  return urlWithQuery(url, { ...args, f: focus }); // eslint-disable-line id-length
};

export default null;
