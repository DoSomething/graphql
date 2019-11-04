import mongoose from 'mongoose';

import config from '../../config';

mongoose.Promise = global.Promise;

mongoose
  .connect(config('services.schools.url'), {
    autoIndex: false,
  })
  .then(() => {
    console.log('Successful connection to Schools DB.');
  })
  .catch(err => console.error(err));

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
export const getSchoolById = async id => {
  return School.findOne({ gsid: id });
};
