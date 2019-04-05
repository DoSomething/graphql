//
// This is our AWS Lambda entry point for Contentful's
// webhooks. We use this to automatically clear cache
// on entries that have changed.
//

const logger = require('heroku-logger');

const config = require('./lib/config').default;
const Cache = require('./lib/src/cache').default;

// A simple helper for building a Lambda response.
const response = (body, statusCode = 200) => ({ statusCode, body });

// The Lambda  'webhook.handler' function:
exports.handler = async event => {
  // @TODO: Should this live in an API Gateway authorizer instead?
  if (event.headers['X-Contentful-Webhook-Key'] !== config('cache.secret')) {
    logger.warn('Invalid API key provided to cache clear endpoint');
    return response('Invalid API key.', 401);
  }

  if (event.body === null || event.body === undefined) {
    return response('Invalid format.', 422);
  }

  // Validate the request format.
  const body = JSON.parse(event.body);
  const expectedFormat = body && body.sys && body.sys.id;
  if (!expectedFormat) {
    logger.error('Got unexpected webhook payload', { body });
    return response('Invalid format.', 422);
  }

  // Clear cache for the specified ID from the Phoenix cache.
  // @TODO: Determine which cache to use based on provided space ID.
  const cache = new Cache(config('services.contentful.phoenix.cache'));

  const id = body.sys.id;
  cache.forget(id);

  logger.info('Cleared cache via Contentful webhook.', { id });
  return response('Success.', 200);
};
