import { get } from 'lodash';
import algoliasearch from 'algoliasearch';

import config from '../../config';

class Algolia {
  constructor() {
    this.client = algoliasearch(
      config('services.algolia.appId'),
      config('services.algolia.secret'),
    );

    // @TODO: need to find a way to allow for dynamic env-based index names.
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

export default Algolia;
