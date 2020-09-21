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

/**
 * Fetches the first page of Location Voting Information records from the Airtable API, and
 * returns data as an object, indexed by ISO-3166-2 location values.
 *
 * Airtable "List Records" endpoints have a default page size of 100 records, so we don't need to
 * paginate through more results, because we'll have a maximum of 50 records (one per U.S. state).
 *
 * @return {Object}
 */
const fetchVotingInformationRecordsByLocation = async () => {
  logger.debug('Fetching LocationVotingInformation records from Airtable');

  try {
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
    logger.warn('Unable to fetch LocationVotingInformation.', {
      error: exception.message,
    });

    throw exception;
  }
};

/**
 * Cache Airtable records to avoid hitting API limit of 5 requests per second per base.
 *
 * Configure the cache to fetch results from the API before cache expires.
 * @see https://hapi.dev/module/catbox/api/?v=11.1.1#policy
 */
const cache = new Cache('airtable', {
  expiresIn: 2 * ONE_MINUTE,
  staleIn: ONE_MINUTE,
  generateFunc: async () => {
    return fetchVotingInformationRecordsByLocation();
  },
  generateTimeout: ONE_MINUTE,
  staleTimeout: ONE_MINUTE / 2,
});

/**
 * Returns a Location Voting Information record for a specific location.
 *
 * @param {String} location
 * @return {Object}
 */
const getVotingInformationByLocation = async location => {
  logger.debug('Checking LocationVotingInformation cache', {
    location,
  });

  try {
    /**
     * This cache key value is arbitrary, as our generateFunc fetches the first page of API results,
     * regardless of the key value passed.
     */
    const data = await cache.get('locationVotingInformationIndex');

    return transformResponse(get(JSON.parse(data), location));
  } catch (exception) {
    logger.warn('Unable to get LocationVotingInformation.', {
      location,
      error: exception.message,
    });

    return null;
  }
};

export default getVotingInformationByLocation;
