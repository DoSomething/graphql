import logger from 'heroku-logger';
import { assign, get, omit } from 'lodash';

import config from '../../config';
import Cache, { ONE_MINUTE } from '../cache';
import { transformResponse } from './helpers';

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
      // Default page size is 100, so we only need one request to fetch info for all 50 states.
      const url = `${AIRTABLE_URL}/v0/${VOTER_REGISTRATION_BASE_ID}/${encodeURI(
        'Location GOTV Information',
      )}`;

      const response = await fetch(url, authorizedRequest);

      const json = await response.json();

      /**
       * Example Airtable API response:
       *
       * "records": [
       *   {
       *     "id": "recEI2oHq2Hfw38dt",
       *     "fields": {
       *         "State": "AL",
       *         "Voter Registration Deadline": "10/25",
       *         "Early Voting Starts": "10/5",
       *         "Absentee Ballot Request Deadline": "10/21",
       *         "Absentee Ballot Return Deadline Type": "received by",
       *         "Early Voting Ends": "10/19"
       *     },
       *     "createdTime": "2020-08-26T19:12:46.000Z"
       *   },
       *   {
       *     "id": "recHvL0w0KSew1v74",
       *     "fields": {
       *         "State": "CA",
       *         "Voter Registration Deadline": "10/23",
       *         "Early Voting Starts": "8/30",
       *         "Absentee Ballot Request Deadline": "10/14",
       *         "Absentee Ballot Return Deadline Type": "received by",
       *         "Early Voting Ends": "9/3",
       *         "Absentee Ballot Return Deadline": "10/18"
       *     },
       *     "createdTime": "2020-08-26T19:12:46.000Z"
       *   },
       * ...
       */

      const recordsByLocation = {};

      json.records.forEach(record => {
        const { id, fields } = record;
        const location = `US-${fields.State}`;

        recordsByLocation[location] = assign(
          { id, location },
          omit(fields, 'State'),
        );
      });

      return JSON.stringify(recordsByLocation);
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

    return transformResponse(get(JSON.parse(allRecords), location));
  } catch (exception) {
    logger.warn('Unable to load Airtable Location Voting Information.', {
      location,
      error: exception.message,
    });

    return null;
  }
};

export default getVotingInformationByLocation;
