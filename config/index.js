import { get } from 'lodash';

import app from './app';
import cache from './cache';
import graphql from './graphql';
import services from './services';

/**
 * Get the requested config, or use default.
 *
 * @param {String} key
 * @param {mixed} defaultValue
 */
export default (key, defaultValue = null) => {
  const config = { app, cache, graphql, services };

  return get(config, key, defaultValue);
};
