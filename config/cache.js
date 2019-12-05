export default {
  /**
   * The cache driver. Either 'dynamodb', 'redis', or 'memory'.
   *
   * @type {String}
   */
  driver: process.env.CACHE_DRIVER || 'memory',

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
