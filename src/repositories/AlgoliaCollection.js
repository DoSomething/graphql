import { getFields } from 'fielddataloader';

import Loader from '../loader';

class AlgoliaCollection {
  constructor(json, context, info) {
    this.json = json;
    this.context = context;
    this.info = info;
  }

  /**
   * Transforms items and wraps inside "Edge" entity.
   */
  get edges() {
    const fields = getFields(this.info, 'Campaign', 'edges.node');

    return this.json.hits.map(({ id }) => ({
      cursor: String(id),
      node: Loader(this.context).campaigns.load(id, fields),
    }));
  }

  /**
   * Returns the PageInfo entity.
   */
  get pageInfo() {
    return {
      endCursor: String(this.json.offset + this.json.length),
      hasNextPage: this.json.offset + this.json.length < this.json.nbHits,
      hasPreviousPage: this.json.offset > 0,
    };
  }
}

export default AlgoliaCollection;
