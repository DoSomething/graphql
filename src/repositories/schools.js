import mongoose from 'mongoose';

import config from '../../config';

mongoose.Promise = global.Promise;

const DB_URL = config('services.schools.url' || null);

if (DB_URL) {
  mongoose.connect(DB_URL, { autoIndex: false });
}

const schoolSchema = new mongoose.Schema({
  _id: String,
  gsid: String,
  name: String,
  city: String,
  state: String,
});

const School = mongoose.model('School', schoolSchema, 'merged_schools');

/**
 * Fetch a school by its ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getSchoolById = async id => School.findOne({ gsid: id });

/**
 * Fetch schools by name for given state.
 *
 * @param {String} state
 * @param {String} searchString
 * @return {Object}
 */
export const searchSchools = async (state, searchString) =>
  School.find({
    state,
    name: {
      $regex: searchString,
      $options: 'i',
    },
  });
