import Loader from '../loader';

class AlgoliaCollection {
  constructor(payload, context) {
    this.context = context;
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
    return this.results.map((result, index) => {
      console.log({ index, result: result.id });

      return {
        cursor: String(index),
        node: Loader(this.context).campaigns.load(result.id),
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
