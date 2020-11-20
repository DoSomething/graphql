import { getUnixTime } from 'date-fns';
import algoliasearch from 'algoliasearch';
import { DataSource } from 'apollo-datasource';
import { get, isNull, isUndefined } from 'lodash';

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

    return `start_date < ${now} AND (is_evergreen=1 OR end_date > ${now})`;
  }

  /**
   * Filter search by campaigns that have actions counting for scholarships.
   */
  get filterScholarshipCampaigns() {
    return ` AND actions.scholarship_entry=1`;
  }

  /**
   * Filter search by campaigns that ONLY have actions that do not count for scholarships.
   */
  get filterNonScholarshipCampaigns() {
    return ` AND NOT actions.scholarship_entry=1`;
  }

  /**
   * Filter search by campaigns containing these causes (using facet filtering).
   *
   * @param {Array} causes
   * @return {String}
   */
  filterCauses(causes) {
    // e.g. ["environment", "racial-justice"] => "cause:environment OR cause:racial-justice".
    const causeFacets = causes.map(cause => `cause:${cause}`).join(' OR ');

    return ` AND (${causeFacets})`;
  }

  /**
   * Search campaigns index
   */
  async searchCampaigns(options = {}) {
    const {
      cursor = '0',
      causes = [],
      isOpen = true,
      hasScholarship = null,
      hasWebsite,
      orderBy = '',
      perPage = 20,
      term = '',
    } = options;

    // e.g. "start_date,desc" => ["start_date", "desc"].
    const [attribute, direction] = orderBy ? orderBy.split(',') : [];
    // If an orderBy is specified, we'll need to query the replica index. We append the sorting strategy to the index
    // name following the replica naming convention (https://bit.ly/32mxQWZ).
    const indexReplicaSuffix =
      attribute && direction ? `_${attribute}_${direction}` : '';

    const index = this.getIndex(`campaigns${indexReplicaSuffix}`);

    // We assume the search is for open campaigns unless explicitly set to `false`
    let filters = isOpen
      ? this.filterOpenCampaigns
      : this.filterClosedCampaigns;

    // If specified, append filter for scholarship/non-scholarship campaigns
    if (!isNull(hasScholarship)) {
      filters += hasScholarship
        ? this.filterScholarshipCampaigns
        : this.filterNonScholarshipCampaigns;
    }

    if (!isUndefined(hasWebsite)) {
      filters += ` AND has_website = ${hasWebsite ? '1' : '0'}`;
    }

    // If specified, append filter for campaign causes.
    if (causes.length) {
      filters += this.filterCauses(causes);
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
