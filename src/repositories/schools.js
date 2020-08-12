import logger from 'heroku-logger';
import { MongoClient } from 'mongodb';

import config from '../../config';

const SCHOOL_NOT_AVAILABLE_SCHOOL_ID = 'school-not-available';

/**
 * Schools are sourced from a Mongo database, in a collection called 'directory'.
 * We use the following fields to source our list of schools.
 *
 * universal-id: This is the unique identifier for a school.
 * entity: We only want documents with entity 'school'. Other values include 'district', etc.
 * name: The name of the school.
 * city: The city that school is located in (e.g. 'Hoboken')
 * state: The state that school is located in (e.g. NJ)
 */

// Cache our connection to the Mongo database.
// @see https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/#example
let cachedDb = null;

function connectToDatabase() {
  const DB_URL = config('services.schools.db.url');

  if (!DB_URL) {
    throw new Error('Schools DB configuration is not set');
  }

  if (cachedDb) {
    logger.debug('Using cached Schools DB instance');
    return Promise.resolve(cachedDb);
  }

  return MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(client => {
    logger.debug('Created new Schools DB instance');
    cachedDb = client.db('greatschools').collection('directory');

    return cachedDb;
  });
}

/**
 * @param {Object} item
 * @return {Object}
 */
export const transformItem = item => {
  if (!item) {
    return null;
  }

  const { name, city, state } = item;

  return {
    id: item['universal-id'],
    name,
    city,
    state,
  };
};

/**
 * Fetch a school by its universal ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getSchoolById = async id => {
  if (id === SCHOOL_NOT_AVAILABLE_SCHOOL_ID) {
    return {
      id: SCHOOL_NOT_AVAILABLE_SCHOOL_ID,
    };
  }

  logger.debug('Finding school', { id });

  const db = await connectToDatabase();

  const result = await db.findOne({ 'universal-id': Number(id) });

  return transformItem(result);
};

/**
 * Fetch schools by name for given location.
 *
 * @param {String} location
 * @param {String} state
 * @param {String} searchString
 * @return {Object}
 */
export const searchSchools = async args => {
  logger.debug('Searching schools', args);

  const db = await connectToDatabase();

  // We'll eventually deprecate the state arg once Phoenix no longer uses it.
  const locationFilter =
    args.state || (args.location ? args.location.substring(3) : null);

  const res = await db
    .find({
      entity: 'school',
      state: locationFilter,
      name: {
        $regex: args.name,
        $options: 'i',
      },
    })
    .limit(20)
    .toArray();

  return res.map(transformItem);
};
