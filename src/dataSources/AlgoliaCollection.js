import { getFields } from 'fielddataloader';

import Loader from '../loader';

class AlgoliaCollection {
  constructor(payload, context, info, entityType) {
    this.info = info;
    this.context = context;
    this.entityType = entityType;
    this.json = payload; // deprecate

    this.offset = payload.offset;
    this.perPage = payload.length;
    this.results = payload.hits;
    this.total = payload.nbHits;
  }

  /**
   * Transforms items and wraps inside "Edge" entity.
   */
  get edges() {
    const fields = getFields(this.info, this.entityType, 'edges.node');

    // return this.json.hits.map((hit, index) => ({
    //   cursor: String(index),
    //   node: Loader(this.context).campaigns.load(hit.id, fields),
    // }));

    return this.results.map((result, index) => {
      console.log({ index, result: result.id });

      return {
        cusor: String(index),
        node: Loader(this.context).campaigns.load(result.id, fields),
      };
    });
  }

  /**
   * Returns the PageInfo entity.
   */
  get pageInfo() {
    // return {
    //   endCursor: String(this.json.offset + this.json.length),
    //   hasNextPage: this.json.offset + this.json.length < this.json.nbHits,
    //   hasPreviousPage: this.json.offset > 0,
    // };

    return {
      endCursor: 'cursorstringhere',
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
}

export default AlgoliaCollection;
