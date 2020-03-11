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

  // Ensure the request has a payload.
  if (event.body === null || event.body === undefined) {
    return response('Invalid format.', 422);
  }

  // Validate against expected request format.
  const body = JSON.parse(event.body);
  const expectedFormat =
    body && body.sys && body.sys.id && body.sys.space.sys.id;

  if (!expectedFormat) {
    logger.error('Got unexpected webhook payload', { body });

    return response('Invalid format.', 422);
  }

  // Clear cache for the specified entry from the Contentful cache.
  const cache = new Cache('contentful');
  const previewCache = new Cache('preview.contentful');

  const id = body.sys.id;
  const type = body.sys.type;
  const spaceId = body.sys.space.sys.id;
  const contentType = body.sys.contentType && body.sys.contentType.sys.id;

  // Clear from DynamoDB (and await to make sure this completes).
  // @TODO: We should clear production cache on 'publish' events, and
  // preview cache on 'save' events (rather than always clearing both).
  await cache.forget(`${type}:${spaceId}:${id}`);
  await previewCache.forget(`${type}:${spaceId}:${id}`);

  logger.info('Cleared cache via Contentful webhook.', { spaceId, id });

  // Clear Contentful cache for homePage content type entry.
  if (contentType === 'homePage') {
    await cache.forget(`${contentType}:${spaceId}`);
    await previewCache.forget(`${contentType}:${spaceId}`);

    logger.info('Cleared homePage cache via Contentful webhook.', {
      spaceId,
      id,
    });
  }

  // List of content types with secondary cache keys (cached by a field other than cannonical ID).
  const secondaryKeys = {
    affiliates: ['utmLabel'],
    campaign: ['legacyCampaignId'],
    causePage: ['slug'],
    collectionPage: ['slug'],
    companyPage: ['slug'],
  };

  // Clear secondary cache key results from the Contentful cache if applicable.
  if (secondaryKeys[contentType]) {
    const cacheKeys = secondaryKeys[contentType];

    for (let i = 0; i < cacheKeys.length; i++) {
      const cacheKey = cacheKeys[i];
      const fieldValue =
        body.fields && body.fields[cacheKey] && body.fields[cacheKey]['en-US'];

      if (fieldValue) {
        // Clear from DynamoDB (and await to make sure this completes).
        // @TODO: We should clear production cache on 'publish' events, and
        // preview cache on 'save' events (rather than always clearing both).
        await cache.forget(`${contentType}:${spaceId}:${fieldValue}`);
        await previewCache.forget(`${contentType}:${spaceId}:${fieldValue}`);

        logger.info(`Cleared ${contentType} cache via Contentful webhook`, {
          spaceId,
          id,
          [cacheKey]: fieldValue,
        });
      }
    }
  }

  return response('Success.', 200);
};
