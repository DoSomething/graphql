import { Client, Policy } from 'catbox';
import Redis from 'catbox-redis';
import DynamoDB from 'catbox-dynamodb';
import Memory from 'catbox-memory';
import logger from 'heroku-logger';

import config from '../config';

/**
 * Get the cache driver.
 *
 * @returns {Client}
 */
const getClient = driver => {
  if (driver === 'dynamodb') {
    return new Client(DynamoDB, { tableName: config('cache.table') });
  }

  if (driver === 'redis') {
    return new Client(Redis, { url: config('cache.url') });
  }

  if (driver === 'memory') {
    return new Client(Memory);
  }

  throw new Error(
    `Invalid driver: ${driver}. Supported: dynamodb, redis, memory.`,
  );
};

export default class {
  constructor({ name, expiresIn }) {
    this.name = name;
    this.client = getClient(config('cache.driver'));
    this.policy = new Policy({ expiresIn }, this.client, 'segment');
  }

  /**
   * Get key from cache.
   * @param {String} key
   * @returns {*}
   */
  async get(key) {
    if (!this.policy.isReady()) {
      await this.client.start();
    }

    return this.policy.get(`${this.name}:${key}`);
  }

  /**
   * Save value in cache.
   * @param {String} key
   * @param {*} value
   */
  async set(key, value) {
    if (!this.policy.isReady()) {
      await this.client.start();
    }

    return this.policy.set(`${this.name}:${key}`, value);
  }

  /**
   * Remove the given key from the cache.
   * @param {String} key
   */
  async forget(key) {
    if (!this.policy.isReady()) {
      await this.client.start();
    }

    return this.policy.drop(`${this.name}:${key}`).catch(exception => {
      logger.error('cache.forget exception', {
        errorMessage: exception.errorMessage,
        message: exception.message,
      });

      // DynamoDB will throw an exception if you try to drop a key
      // that doesn't exist. We want to handle that gracefully.
      if (exception.message === 'Item does not exist') {
        return null;
      }

      throw exception;
    });
  }

  /**
   * Get an item from the cache, or run the callback
   * to fetch it and then store the result.
   *
   * @param {String} key
   * @param {Function} callback
   */
  async remember(key, callback) {
    const cachedEntry = await this.get(key);

    if (cachedEntry) {
      logger.debug('Cache hit.', { cache: this.name, key });

      return cachedEntry;
    }

    logger.debug('Cache miss.', { cache: this.name, key });
    const data = await callback();

    this.set(key, data);

    return data;
  }
}
