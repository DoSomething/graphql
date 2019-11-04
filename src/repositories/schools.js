import mongoose from 'mongoose';

import config from '../../config';

mongoose.Promise = global.Promise;

mongoose.connect(config('services.schools.url'), {
  autoIndex: false,
});

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
 * @return {Object}
 */
export const getSchoolById = async id => School.findOne({ gsid: id });

/**
 * Fetch schools by name per given state.
 *
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
