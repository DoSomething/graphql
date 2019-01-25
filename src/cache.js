import { Client, Policy } from 'catbox';
import Redis from 'catbox-redis';
import DynamoDB from 'catbox-dynamodb';
import Memory from 'catbox-memory';

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
}
