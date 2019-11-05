import mongoose from 'mongoose';
import logger from 'heroku-logger';

import config from '../../config';

const DB_URL = config('services.schools.url' || null);

if (DB_URL) {
  mongoose
    .connect(DB_URL, {
      dbName: config('services.schools.name' || 'greatschools'),
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .catch(err => logger.error(err.message, err));
}

const schema = new mongoose.Schema({
  city: String,
  entity: String,
  name: String,
  state: String,
  'universal-id': Number,
});

const Directory = mongoose.model('Directory', schema, 'directory');

/**
 * @return {Boolean}
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * @param {Object} item
 * @return {Object}
 */
export const transformItem = item => {
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
  if (!isDatabaseConnected()) {
    throw new Error('No connection to Schools DB.');
  }

  logger.debug('Finding school', { id });

  const result = await Directory.findOne({ 'universal-id': Number(id) });

  return transformItem(result);
};

/**
 * Fetch schools by name for given state.
 *
 * @param {String} state
 * @param {String} searchString
 * @return {Object}
 */
export const searchSchools = async (state, searchString) => {
  if (!isDatabaseConnected()) {
    throw new Error('No connection to Schools DB.');
  }

  logger.debug('Searching schools', { state, searchString });

  const res = await Directory.find({
    entity: 'school',
    state,
    name: {
      $regex: searchString,
      $options: 'i',
    },
  }).limit(20);

  return res.map(transformItem);
};
