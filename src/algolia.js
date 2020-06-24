import { get } from 'lodash';
import algoliasearch from 'algoliasearch';

import config from '../config';

class Algolia {
  constructor() {
    this.client = algoliasearch(
      config('services.algolia.appId'),
      config('services.algolia.secret'),
    );

    this.indices = {};
  }

  getIndex(indexName) {
    if (!indexName) {
      throw new Error('Please specify an Algolia index name to search.');
    }

    if (!get(this.indices, indexName, null)) {
      this.indices[indexName] = this.client.initIndex(indexName);
    }

    return get(this.indices, indexName);
  }
}

/*
 * Variable that stores single instance of Algolia.
 */
let algoliaInstance;

/**
 * Get instance of Algolia class.
 *
 * @return {Algolia}
 */
export function algolia(indexName = null) {
  if (!algoliaInstance) {
    algoliaInstance = new Algolia();
  }

  return algoliaInstance.getIndex(indexName);
}
