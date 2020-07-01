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

    return this.json.hits.map((hit, index) => ({
      cursor: String(index),
      node: Loader(this.context).campaigns.load(hit.id, fields),
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

// { context:
//   { authorization: '',
//     _extensionStack: GraphQLExtensionStack { extensions: [] },
//     dataSources: { algoliaAPI: [AlgoliaAPI] } },
//  info:
//   { fieldName: 'searchCampaigns',
//     fieldNodes: [ [Object] ],
//     returnType: AlgoliaCollection!,
//     parentType: Query,
//     path: { prev: undefined, key: 'searchCampaigns' },
//     schema:
//      GraphQLSchema {
//        __validationErrors: [],
//        extensions: undefined,
//        astNode: undefined,
//        extensionASTNodes: undefined,
//        __allowedLegacyNames: [],
//        _queryType: Query,
//        _mutationType: undefined,
//        _subscriptionType: undefined,
//        _directives: [Array],
//        _typeMap: [Object],
//        _possibleTypeMap: [Object: null prototype] {},
//        _implementations: [Object: null prototype] {} },
//     fragments: [Object: null prototype] {},
//     rootValue: undefined,
//     operation:
//      { kind: 'OperationDefinition',
//        operation: 'query',
//        name: undefined,
//        directives: undefined,
//        variableDefinitions: [],
//        selectionSet: [Object] },
//     variableValues: {} }
//   }
// }
