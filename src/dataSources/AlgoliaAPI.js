const { DataSource } = require('apollo-datasource');
const { InMemoryLRUCache } = require('apollo-server-caching');

const Algolia = require('../services/Algolia').default;
const config = require('../../config').default;

class AlgoliaAPI extends DataSource {
  constructor() {
    super();

    this.prefix = config('services.algolia.prefix');

    this.client = new Algolia();
  }

  initialize({ context, cache }) {
    this.context = context;
    this.cache = cache || new InMemoryLRUCache();
  }

  didEncounterError(error) {
    throw error;
  }

  // cacheKey(id) {
  //   return `algolia-generated-cache-key`;
  // }

  /**
   * Initialize prefix-specific environment named index
   * @param {String} indexName
   */
  initIndex(indexName) {
    return this.client.getIndex(`${this.prefix}_${indexName}`);
  }

  /**
   * Search campaigns index
   */
  async searchCampaigns(options = {}) {
    const { cursor = '0', isOpen = true, perPage = 20, term = '' } = options;

    const index = this.initIndex('campaigns');

    return await index.search(term, {
      attributesToRetrieve: ['id'],
      filters: isOpen
        ? this.client.filterOpenCampaigns
        : this.client.filterClosedCampaigns,
      length: perPage,
      offset: Number(cursor),
    });
  }

  /**
   * Search pages index
   *
   * @TODO: Example of other methods in class, needs to be implemented!
   */
  async searchPages() {
    const index = this.initIndex('pages');

    return await index.search('');
  }
}

module.exports = AlgoliaAPI;