import { get, isNull } from 'lodash';
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
   * Filter search by campaigns that have actions counting for scholarships.
   */
  get filterScholarshipCampaigns() {
    return ` AND actions.scholarship_entry=1`;
  }

  /**
   * Filter search by campaigns that have actions that do not count for scholarships.
   */
  get filterNonScholarshipCampaigns() {
    return ` AND actions.scholarship_entry=0`;
  }

  /**
   * Search campaigns index
   */
  async searchCampaigns(options = {}) {
    const { cursor = '0', isOpen = true, hasScholarship = null, perPage = 20, term = '' } = options;

    const index = this.getIndex('campaigns');

    // We assume the search is for open campaigns unless explicitly set to `false`
    let filters = isOpen ? this.filterOpenCampaigns : this.filterClosedCampaigns;
    
    // If specified, append filter for scholarship/non-scholarship campaigns
    if (!isNull(hasScholarship)) {
      filters += (hasScholarship ? this.filterScholarshipCampaigns : this.filterNonScholarshipCampaigns);
    }

    const results = await index.search(term, {
      attributesToRetrieve: ['id'],
      filters,
      length: perPage,
      offset: Number(cursor),
    });

    return results;
  }
}

export default Algolia;
