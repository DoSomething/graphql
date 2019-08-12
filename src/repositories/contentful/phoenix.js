import { createClient } from 'contentful';
import logger from 'heroku-logger';
import { URL } from 'url';

import { urlWithQuery } from '../helpers';
import config from '../../../config';
import Loader from '../../loader';
import Cache from '../../cache';

const cache = new Cache(config('services.contentful.cache'));
const spaceId = config('services.contentful.phoenix.spaceId');

const contentfulSpaceConfig = {
  space: spaceId,
  environment: config('services.contentful.phoenix.environment'),
  resolveLinks: false,
};

const contentApi = createClient({
  ...contentfulSpaceConfig,
  accessToken: config('services.contentful.phoenix.accessToken'),
});

const previewApi = createClient({
  ...contentfulSpaceConfig,
  host: 'preview.contentful.com',
  accessToken: config('services.contentful.phoenix.previewToken'),
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
export const getPhoenixContentfulEntryById = async (id, context) => {
  const { preview } = context;

  logger.debug('Loading Phoenix Contentful entry', { id, preview });

  // If we're previewing, use Contentful's Preview API and
  // don't bother trying to cache content on our end:
  if (preview) {
    const json = await previewApi.getEntry(id);
    return transformItem(json);
  }

  // Otherwise, read from cache or Contentful's Content API:
  return cache.remember(`Entry:${spaceId}:${id}`, async () => {
    try {
      const json = await contentApi.getEntry(id);
      return transformItem(json);
    } catch (exception) {
      logger.warn('Unable to load Phoenix Contentful entry.', {
        id,
        error: exception.message,
      });
    }

    return null;
  });
};

/**
 * Load a Phoenix Contentful Entry by query.
 *
 * @param  {Object} api
 * @param  {Object} query
 * @return {Object}
 */
const loadEntryByQuery = async (api, query) => {
  try {
    const json = await api.getEntries(query);

    const item = json.items[0];

    if (!item) {
      return null;
    }

    return transformItem(item);
  } catch (exception) {
    logger.warn('Unable to load Phoenix Contentful entry.', {
      query,
      error: exception.message,
    });
  }

  return null;
};

/**
 * Search for a Phoenix Contentful Entry by field.
 *
 * @param  {String} contentType
 * @param  {String} fieldName
 * @param  {String} fieldValue
 * @param  {Object} context
 * @return {Object}
 */
export const getPhoenixContentfulEntryByField = async (
  contentType,
  fieldName,
  fieldValue,
  context,
) => {
  const { preview } = context;

  const query = {
    content_type: contentType,
    [`fields.${fieldName}`]: fieldValue,
    order: '-sys.updatedAt',
    limit: 1,
  };

  logger.debug('Loading Phoenix Contentful entry', {
    query,
    preview,
  });

  // If we're previewing, use Contentful's Preview API and
  // don't bother trying to cache content on our end:
  if (preview) {
    return loadEntryByQuery(previewApi, query);
  }

  // Otherwise, read from cache or Contentful's Content API:
  return cache.remember(`${contentType}:${spaceId}:${fieldValue}`, async () =>
    loadEntryByQuery(contentApi, query),
  );
};

/**
 * Search for a Phoenix Contentful Campaign entry by campaignId.
 *
 * @param {String} id
 * @return {Object}
 */
export const getCampaignWebsiteByCampaignId = async (campaignId, context) =>
  getPhoenixContentfulEntryByField(
    'campaign',
    'legacyCampaignId',
    campaignId,
    context,
  );

/**
 * Search for a Phoenix Contentful affiliate entry by utmLabel.
 *
 * @param {String} id
 * @return {Object}
 */
export const getAffiliateByUtmLabel = async (utmLabel, context) =>
  getPhoenixContentfulEntryByField('affiliates', 'utmLabel', utmLabel, context);

/**
 * Fetch a Phoenix Contentful entry by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getPhoenixContentfulAssetById = async (id, context) => {
  const { preview } = context;

  logger.debug('Loading Phoenix Contentful asset', { id, preview });

  // If we're previewing, use Contentful's Preview API and
  // don't bother trying to cache content on our end:
  if (preview) {
    const json = await previewApi.getAsset(id);
    return transformAsset(json);
  }

  // Otherwise, read from cache or Contentful's Content API:
  return cache.remember(`Asset:${spaceId}:${id}`, async () => {
    try {
      const json = await contentApi.getAsset(id);
      return transformAsset(json);
    } catch (exception) {
      logger.warn('Unable to load Phoenix Contentful asset.', {
        id,
        error: exception.message,
      });
    }

    return null;
  });
};

/**
 * Fetch a Phoenix Contentful entry or asset by "link".
 *
 * @param {Object} link
 * @param {Object} context
 */
export const getPhoenixContentfulItemByLink = async (link, context) => {
  if (!link) {
    return null;
  }

  const { linkType, id } = link.sys;

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
 * GraphQL resolver for Contentful links.
 *
 * @param {Object} entry
 * @param {Object} context
 * @param {Object} info
 */
export const linkResolver = (entry, _, context, info, name) => {
  const { parentType } = info;
  const fieldName = name ? name : info.fieldName;
  const link = entry[fieldName];

  logger.debug(`Resolving link(s) on ${parentType.name}.${fieldName}`);

  if (Array.isArray(link)) {
    return link.map(asset => getPhoenixContentfulItemByLink(asset, context));
  }

  return getPhoenixContentfulItemByLink(link, context);
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
  //
  // If using a supported resize behavior, focus on any
  // faces found in the photo. Otherwise, center it.
  let focus = 'center';
  if (['PAD', 'FILL', 'CROP', 'THUMB'].includes(args.fit)) {
    focus = 'faces';
  }

  return urlWithQuery(url, { ...args, f: focus }); // eslint-disable-line id-length
};

export default null;
