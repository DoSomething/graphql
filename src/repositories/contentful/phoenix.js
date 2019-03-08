import { createClient } from 'contentful';
import logger from 'heroku-logger';

import config from '../../../config';
import Cache from '../../cache';

const cache = new Cache(config('services.contentful.phoenix.cache'));

const contentfulClient = createClient({
  space: config('services.contentful.phoenix.spaceId'),
  accessToken: config('services.contentful.phoenix.accessToken'),
  environment: config('services.contentful.phoenix.environment'),
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

export default null;
