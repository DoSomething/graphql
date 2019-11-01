import { get, isNil, last } from 'lodash';

import { transformCollection } from './helpers';

class Collection {
  constructor(json) {
    this.json = json;
  }

  /**
   * Transforms items and wraps inside "Edge" entity.
   */
  get edges() {
    return transformCollection(this.json).map(node => ({
      node,
      cursor: node.cursor,
    }));
  }

  /**
   * Returns the PageInfo entity.
   */
  get pageInfo() {
    return {
      endCursor: get(last(this.json.data), 'cursor', null),
      hasNextPage: !isNil(get(this.json, 'meta.cursor.next')),
      hasPreviousPage: !isNil(get(this.json, 'meta.cursor.prev')),
    };
  }
}

export default Collection;
