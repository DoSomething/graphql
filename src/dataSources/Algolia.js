import { get } from 'lodash';
import { getUnixTime } from 'date-fns';
import algoliasearch from 'algoliasearch';
import { DataSource } from 'apollo-datasource';

import config from '../../config';

class Algolia extends DataSource {
  constructor() {
    super();

    this.prefix = config('services.algolia.prefix');

    this.client = algoliasearch(
      config('services.algolia.appId'),
      config('services.algolia.secret'),
    );

    this.indices = {};
  }

  initialize({ context }) {
    this.context = context;
  }

  didEncounterError(error) {
    throw error;
  }

  /**
   * Get specified data index from Algolia to search against.
   *
   * @param {String} indexName
   */
  getIndex(indexName) {
    if (!indexName) {
      throw new Error('Please specify an Algolia index name to search.');
    }

    const index = `${this.prefix}_${indexName}`;

    if (!get(this.indices, index, null)) {
      this.indices[index] = this.client.initIndex(index);
    }

    return get(this.indices, index);
  }

  /**
   * Filter search by closed campaigns.
   */
  get filterClosedCampaigns() {
    const now = getUnixTime(Date.now());

    return `start_date > ${now} OR end_date < ${now}`;
  }

  /**
   * Filter search by open campaigns.
   */
  get filterOpenCampaigns() {
    const now = getUnixTime(Date.now());

    return `start_date < ${now} AND end_date > ${now}`;
  }

  /**
   * Search campaigns index
   */
  async searchCampaigns(options = {}) {
    const { cursor = '0', isOpen = true, perPage = 20, term = '' } = options;

    const index = this.getIndex('campaigns');

    const results = await index.search(term, {
      attributesToRetrieve: ['id'],
      filters: isOpen ? this.filterOpenCampaigns : this.filterClosedCampaigns,
      length: perPage,
      offset: Number(cursor),
    });

    return results;
  }
}

export default Algolia;
