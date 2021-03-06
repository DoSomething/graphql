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
   * Filter search by campaigns containing these action types (using facet filtering).
   *
   * @param {Array} actionTypes
   * @return {String}
   */
  filterActionTypes(actionTypes) {
    // e.g. ["make-something", "share-something"] => "actions.action_type:make-something OR actions.action_type:share-something".
    const actionTypeFacets = actionTypes
      .map(actionType => `actions.action_type:${actionType}`)
      .join(' OR ');

    return ` AND (${actionTypeFacets})`;
  }

  /**
   * Filter search by campaigns containing online location (boolean) (using facet filtering).
   *
   * @param {Boolean} online
   * @return {String}
   */
  filterOnlineLocation(online) {
    if (!online) {
      return ` AND NOT actions.online=1`;
    }

    return ` AND actions.online=1`;
  }

  /**
   * Filter search by campaigns containing these time commitments (using facet filtering).
   *
   * @param {Array} timeCommitments
   * @return {String}
   */
  filterTimeCommitments(timeCommitments) {
    // e.g. ["0.5-1.0", "1.0-3.0"] => "actions.time_commitment:0.5-1.0 OR actions.action_type:1.0-3.0".
    const timeCommitmentFacets = timeCommitments
      .map(timeCommitment => `actions.time_commitment:${timeCommitment}`)
      .join(' OR ');

    return ` AND (${timeCommitmentFacets})`;
  }

  /**
   * Exclude list of campaign IDs.
   *
   * @param {Array} ids
   * @return {String}
   */
  filterExcludedIds(ids) {
    return ids.map(id => ` AND id!=${id}`).join(' ');
  }

  /**
   * Search campaigns index
   */
  async searchCampaigns(options = {}) {
    const {
      actionTypes = [],
      cursor = '0',
      causes = [],
      isOnline = null,
      isOpen = true,
      isGroupCampaign,
      hasScholarship = null,
      hasWebsite,
      orderBy = '',
      perPage = 20,
      term = '',
      timeCommitments = [],
      excludeIds = [],
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

    // If specified, filter for only group/non-group campaigns.
    if (!isUndefined(isGroupCampaign)) {
      filters += ` AND is_group_campaign = ${isGroupCampaign ? '1' : '0'}`;
    }

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
    if (causes && causes.length) {
      filters += this.filterCauses(causes);
    }

    // If specified, append filter for campaign action types.
    if (actionTypes && actionTypes.length) {
      filters += this.filterActionTypes(actionTypes);
    }

    // If specified, append filter for online/offline campaigns
    if (!isNull(isOnline)) {
      filters += this.filterOnlineLocation(isOnline);
    }

    // If specified, append filter for campaign time commitments.
    if (timeCommitments && timeCommitments.length) {
      filters += this.filterTimeCommitments(timeCommitments);
    }

    // If specified, append filter to exclude campaigns with provided IDs.
    if (excludeIds && excludeIds.length) {
      filters += this.filterExcludedIds(excludeIds);
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
