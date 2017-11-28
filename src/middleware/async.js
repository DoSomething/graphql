/**
 * Prepare an async function for Express.
 *
 * @return {Promise}
 */
export default (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
