import { URL } from 'url';
import logger from 'heroku-logger';
import { createClient } from 'contentful';

import { urlWithQuery } from '../helpers';
import config from '../../../config';
import Loader from '../../loader';
import Cache, { ONE_MONTH } from '../../cache';

const contentCache = new Cache('contentful', ONE_MONTH);
const previewCache = new Cache('preview.contentful', ONE_MONTH);

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
const transformItem = json => {
  const fields = json.fields;

  if (fields.legacyCampaignId) {
    fields.campaignId = fields.legacyCampaignId;
  }

  return {
    id: json.sys.id,
    contentType: json.sys.contentType.sys.id,
    createdAt: json.sys.createdAt,
    updatedAt: json.sys.updatedAt,
    ...fields,
  };
}

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

  logger.debug('Loading Contentful entry', {
    id,
    spaceId,
    preview,
  });

  // Choose the right cache and API for this request:
  const cache = preview ? previewCache : contentCache;
  const api = preview ? previewApi : contentApi;

  return cache.remember(`Entry:${spaceId}:${id}`, async () => {
    try {
      const json = await api.getEntry(id);
      return transformItem(json);
    } catch (exception) {
      logger.warn('Unable to load Contentful entry.', {
        id,
        spaceId,
        preview,
        error: exception.message,
      });
    }

    return null;
  });
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

  logger.debug('Loading Contentful entry', {
    query,
    preview,
  });

  // Choose the right cache and API for this request:
  const cache = preview ? previewCache : contentCache;
  const api = preview ? previewApi : contentApi;

  // Otherwise, read from cache or Contentful's Content API:
  return cache.remember(`${contentType}:${spaceId}:${fieldValue}`, async () => {
    try {
      const json = await api.getEntries(query);

      const item = json.items[0];

      if (!item) {
        return null;
      }

      return transformItem(item);
    } catch (exception) {
      logger.warn('Unable to load Contentful entry.', {
        query,
        spaceId,
        preview,
        error: exception.message,
      });
    }

    return null;
  });
};

/**
 * Search for a Phoenix Contentful HomePage entry.
 *
 * @param {Object} context
 */
export const getHomePage = async context => {
  const { preview } = context;

  const query = {
    content_type: 'homePage',
    order: '-sys.updatedAt',
    limit: 1,
  };

  logger.debug('Loading Contentful HomePage entry', {
    query,
    preview,
  });

  // Choose the right cache and API for this request:
  const cache = preview ? previewCache : contentCache;
  const api = preview ? previewApi : contentApi;

  // Read from cache or Contentful's Content API:
  return cache.remember(`homePage:${spaceId}`, async () => {
    try {
      const json = await api.getEntries(query);

      const item = json.items[0];

      if (!item) {
        return null;
      }

      return transformItem(item);
    } catch (exception) {
      logger.warn('Unable to load Contentful HomePage entry', {
        query,
        spaceId,
        preview,
        error: exception.message,
      });
    }

    return null;
  });
};

/**
 * Search for a Phoenix Contentful Campaign entry by campaignId.
 *
 * @param {String} id
 * @return {Object}
 */
export const getCampaignWebsiteByCampaignId = async (id, context) =>
  getPhoenixContentfulEntryByField('campaign', 'legacyCampaignId', id, context);

/**
 * Search for a Phoenix Contentful Page entry by slug.
 *
 * @param {String} slug
 * @return {Object}
 */
export const getPageBySlug = async (slug, context) =>
  getPhoenixContentfulEntryByField('page', 'slug', slug, context);

/**
 * Search for a Phoenix Contentful Cause Page entry by slug.
 *
 * @param {String} slug
 * @return {Object}
 */
export const getCausePageBySlug = async (slug, context) =>
  getPhoenixContentfulEntryByField('causePage', 'slug', slug, context);

/**
 * Search for a Phoenix Contentful Collection Page entry by slug.
 *
 * @param {String} slug
 * @return {Object}
 */
export const getCollectionPageBySlug = async (slug, context) =>
  getPhoenixContentfulEntryByField('collectionPage', 'slug', slug, context);

/**
 * Search for a Phoenix Contentful Company Page entry by slug.
 *
 * @param {String} slug
 * @return {Object}
 */
export const getCompanyPageBySlug = async (slug, context) =>
  getPhoenixContentfulEntryByField('companyPage', 'slug', slug, context);

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

  logger.debug('Loading Contentful asset', {
    id,
    spaceId,
    preview,
  });

  // Choose the right cache and API for this request:
  const cache = preview ? previewCache : contentCache;
  const api = preview ? previewApi : contentApi;

  // Otherwise, read from cache or Contentful's Content API:
  return cache.remember(`Asset:${spaceId}:${id}`, async () => {
    try {
      const json = await api.getAsset(id);
      return transformAsset(json);
    } catch (exception) {
      logger.warn('Unable to load Contentful asset.', {
        id,
        spaceId,
        preview,
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
export const linkResolver = (entry, _, context, info, resolvedFieldName) => {
  const { parentType } = info;
  const fieldName = resolvedFieldName || info.fieldName;
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

  // If the hostname indicates that this asset exceeds 20MB, return null
  // since transforms won't apply.
  // https://www.contentful.com/developers/docs/concepts/images
  if (url.hostname === 'downloads.ctfassets.net') {
    return null;
  }

  // If this isn't using the Images API, don't try to transform:
  if (url.hostname !== 'images.ctfassets.net') {
    return url.toString();
  }

  // If using a supported resize behavior, focus on any
  // faces found in the photo. Otherwise, center it.
  let focus = 'center';
  if (['PAD', 'FILL', 'CROP', 'THUMB'].includes(args.fit)) {
    focus = 'faces';
  }

  return urlWithQuery(url, { ...args, f: focus }); // eslint-disable-line id-length
};

/**
 * Format choices for the QuizBlock component.
 *
 * @param {*} question
 */
const parseQuestionChoices = question => {
  const choices = question.choices || [];

  return choices.map((choice, index) => ({
    ...choice,
    id: index.toString(),
  }));
};

/**
 * Format questions for the QuizBlock component.
 *
 * @param {*} question
 */
export const parseQuizQuestions = quiz => {
  const questions = quiz.questions || [];

  return questions.map((question, index) => ({
    ...question,
    id: index.toString(),
    choices: parseQuestionChoices(question),
  }));
};

/**
 * Format results for the QuizBlock component.
 *
 * @param {*} question
 */
export const parseQuizResults = quiz => {
  const results = quiz.results || [];

  return results.map((result, index) => ({
    id: String.fromCharCode(index + 65), // A, B, C...
    ...result,
  }));
};
