export default {
  /**
   * The cache driver. Either 'redis' or 'dynamodb'.
   *
   * @type {String}
   */
  driver: process.env.CACHE_DRIVER || 'redis',

  /**
   * The Redis server URL, for example
   * 'redis://127.0.0.1:6379'.
   *
   * @type {String}
   */
  url: process.env.REDIS_URL,

  /**
   * The DynamoDB table name, for example
   * 'dosomething-graphql-dev-cache'.
   *
   * @type {String}
   */
  table: process.env.DYNAMODB_TABLE,

  /**
   * The secret key for clearing cache via a webhook.
   *
   * @type {String}
   */
  secret: process.env.WEBHOOK_SECRET,
};
