import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLDateTime } from 'graphql-iso-date';
import { upperFirst, camelCase } from 'lodash';
import { gql } from 'apollo-server';

import Loader from '../../loader';

const entryFields = `
    "The Contentful ID for this block."
    id: String!
    "The time this entry was last modified."
    updatedAt: DateTime
    "The time when this entry was originally created."
    createdAt: DateTime
`;

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar DateTime

  interface Block {
    ${entryFields}
  }

  type PostGallery implements Block {
    ${entryFields}
    internalTitle: String!
    actionIds: [Int]!
  }

  type Query {
    "Get a block by ID."
    block(id: String!): Block
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  DateTime: GraphQLDateTime,
  Query: {
    block: (_, args, context) => Loader(context).blocks.load(args.id),
  },
  Block: {
    __resolveType: block => upperFirst(camelCase(block.contentType)),
  },
};

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
