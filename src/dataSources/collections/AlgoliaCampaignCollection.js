/**
 * Wrapper class for collecting Algolia Campaign search results
 * and providing cursor based pagination.
 */
class AlgoliaCampaignCollection {
  constructor(payload, context) {
    this.context = context;
    this.currentPageResults = payload.hits;
    this.offset = payload.offset;
    this.perPage = payload.length;
    this.totalResultsFound = payload.nbHits;
  }

  /**
   * Returns end cursor to obtain next list of results.
   */
  get endCursor() {
    const cursor = this.offset + this.currentPageResults.length;

    return cursor <= this.totalResultsFound
      ? cursor
      : this.totalResultsFound - 1;
  }

  /**
   * Returns the Edge entity.
   */
  get edges() {
    return this.currentPageResults.map((result, index) => ({
      cursor: String(this.offset + index),
      _id: result.id,
    }));
  }

  /**
   * Returns the PageInfo entity.
   */
  get pageInfo() {
    return {
      endCursor: String(this.endCursor),
      hasNextPage: this.offset + this.perPage < this.totalResultsFound,
      hasPreviousPage: this.offset > 0,
    };
  }
}

export default AlgoliaCampaignCollection;
