import logger from 'heroku-logger';

import config from '../../config';
import { transformItem } from './helpers';

const GAMBIT_CONTENT_URL = config('services.gambitContent.url');
const GAMBIT_CONTENT_QUERY = `?apiKey=${config(
  'services.gambitContent.apiKey',
)}`;

/**
 * Fetch a topic from Gambit by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getTopicById = async (id, options) => {
  logger.debug('Loading topic from Gambit Content', { id });
  try {
    const response = await fetch(
      `${GAMBIT_CONTENT_URL}/v1/topics/${id}${GAMBIT_CONTENT_QUERY}`,
      options,
    );
    const json = await response.json();

    return transformItem(json);
  } catch (exception) {
    const error = exception.message;
    logger.warn('Unable to load topic.', { id, error, options });
  }

  return null;
};

export default null;
