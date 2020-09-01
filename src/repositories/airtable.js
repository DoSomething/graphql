import logger from 'heroku-logger';
import { assign, find, omit } from 'lodash';

import config from '../../config';
import Cache, { ONE_MINUTE } from '../cache';
import { transformCollection } from './helpers';

const AIRTABLE_URL = config('services.airtable.url');
const VOTER_REGISTRATION_BASE_ID = config(
  'services.airtable.bases.voterRegistration',
);

const authorizedRequest = {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${config('services.airtable.apiKey')}`,
  },
};

// Cache results to avoid hitting Airtable's limit of 5 API requests per second per base.
const cache = new Cache('airtable', ONE_MINUTE);

/**
 * Returns all Location Voting Information records.
 */
const getAllLocationVotingInformationRecords = async () => {
  return cache.remember('LocationVotingInformation', async () => {
    try {
      // Default pageSize is 100, so we only need one request to fetch info for all 50 states.
      const url = `${AIRTABLE_URL}/v0/${VOTER_REGISTRATION_BASE_ID}/${encodeURI(
        'Location GOTV Information',
      )}`;

      const response = await fetch(url, authorizedRequest);

      const json = await response.json();

      const data = json.records.map(record => {
        const { id, fields } = record;
        // Calculate a location field based on State field, then exclude the State field.
        return assign(
          { id, location: `US-${fields.State}` },
          omit(fields, 'State'),
        );
      });

      // Save our array as a string in cache.
      return JSON.stringify(transformCollection({ data }));
    } catch (exception) {
      logger.warn('Unable to load Airtable Location Voting Information.', {
        error: exception.message,
      });
    }

    return null;
  });
};

/**
 * Returns a Location Voting Information record for a specific location.
 *
 * @param {String} location
 * @return {Object}
 */
const getVotingInformationByLocation = async location => {
  logger.debug('Loading Location Voting Information from Airtable', {
    location,
  });

  try {
    const allRecords = await getAllLocationVotingInformationRecords();

    return find(JSON.parse(allRecords), { location });
  } catch (exception) {
    logger.warn('Unable to load Airtable Location Voting Information.', {
      location,
      error: exception.message,
    });

    return null;
  }
};

export default getVotingInformationByLocation;
