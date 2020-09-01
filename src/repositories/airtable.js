import { stringify } from 'qs';
import logger from 'heroku-logger';
import { assign, omit } from 'lodash';

import config from '../../config';
import Cache, { ONE_MINUTE } from '../cache';
import { transformResponse } from './helpers';

const AIRTABLE_URL = config('services.airtable.url');

const authorizedRequest = {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${config('services.airtable.apiKey')}`,
  },
};

// Airtable limits API requests to 5 requests per second per base, so we'll cache results.
const cache = new Cache('airtable', ONE_MINUTE);

/**
 * Fetch voting information from Airtable by location.
 *
 * @param {String} location
 * @return {Object}
 */
const getVotingInformationByLocation = async location => {
  logger.debug('Loading Location Voting Information from Airtable', {
    location,
  });

  return cache.remember(`LocationVotingInformation:${location}`, async () => {
    try {
      const queryString = stringify({
        filterByFormula: `State="${location.substring(3)}"`,
      });

      const url = `${AIRTABLE_URL}/v0/${config(
        'services.airtable.bases.voterRegistration',
      )}/${encodeURI('Location GOTV Information')}?${queryString}`;

      const response = await fetch(url, authorizedRequest);

      const json = await response.json();

      if (!json.records) {
        return null;
      }

      const item = json.records[0];
      const { id, fields } = item;

      // Add a location property, remove the State property.
      return transformResponse(assign({ id, location }, omit(fields, 'State')));
    } catch (exception) {
      logger.warn('Unable to load Airtable Location Voting Information.', {
        location,
        error: exception.message,
      });
    }

    return null;
  });
};

export default getVotingInformationByLocation;
