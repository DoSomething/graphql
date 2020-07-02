import { get } from 'lodash';
import { getUnixTime } from 'date-fns';
import algoliasearch from 'algoliasearch';

import config from '../../config';

class Algolia {
  constructor() {
    this.client = algoliasearch(
      config('services.algolia.appId'),
      config('services.algolia.secret'),
    );

    this.indices = {};
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

    if (!get(this.indices, indexName, null)) {
      this.indices[indexName] = this.client.initIndex(indexName);
    }

    return get(this.indices, indexName);
  }

  /**
   * Filter search by open campaigns.
   */
  get filterOpenCampaigns() {
    const now = getUnixTime(Date.now());

    return `start_date < ${now} AND end_date > ${now}`;
  }

  /**
   * Filter search by closed campaigns.
   */
  get filterClosedCampaigns() {
    const now = getUnixTime(Date.now());

    return `start_date > ${now} OR end_date < ${now}`;
  }
}

export default Algolia;

/**
 * Search campaigns (using Algolia).
 *
 * @return {Array}
 */
// export const searchCampaigns = async (root, args, context, info) => {
//   const { cursor = '0', term, isOpen, perPage } = args;

//   logger.debug('Searching campaigns with Algolia', { term, isOpen, cursor });

//   const now = getUnixTime(Date.now());
//   const isOpenFilter = `start_date < ${now} AND end_date > ${now}`;
//   const isClosedFilter = `start_date > ${now} OR end_date < ${now}`;
//   const results = await algolia('local_campaigns').search(term, {
//     filters: isOpen ? isOpenFilter : isClosedFilter,
//     attributesToRetrieve: ['id'],
//     length: perPage,
//     offset: Number(cursor),
//   });

//   return new AlgoliaCollection(results, context, info);
// };
