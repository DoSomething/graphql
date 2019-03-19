import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import GraphQLJSON from 'graphql-type-json';
import { gql } from 'apollo-server';
import { get } from 'lodash';

import Loader from '../../loader';
import { createImageUrl } from '../../repositories/contentful/phoenix';

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
  scalar JSON
  scalar DateTime
  scalar AbsoluteUrl

  enum ResizeOption {
    "Resize the image to the specified dimensions, padding the image if needed."
    PAD
    "Resize the image to the specified dimensions, cropping the image if needed."
    FILL
    "Resize the image to the specified dimensions, changing the original aspect ratio if needed."
    SCALE
    "Crop a part of the original image to fit into the specified dimensions."
    CROP
    "Create a thumbnail from the image."
    THUMB
  }

  interface Block {
    ${entryFields}
  }

  type Asset {
    "Title for this asset."
    title: String
    "Description for this asset."
    description: String
    "Mime-type for this asset."
    contentType: String,
    "The URL where this file is available at."
    url(w: Int, h: Int, fit: ResizeOption): AbsoluteUrl,
  }

  type ImagesBlock implements Block {
    "The images to be included in this block."
    images: [Asset]
    ${entryFields}
  }

  type EmbedBlock implements Block {
    "The URL of the content to be embedded."
    url: String!
    ${entryFields}
  }

  type PostGalleryBlock implements Block {
    "The internal-facing title for this gallery."
    internalTitle: String!
    "The list of Action IDs to show in this gallery."
    actionIds: [String]!
    ${entryFields}
  }

  type TextSubmissionBlock implements Block {
    "The internal-facing title for this text submission action."
    internalTitle: String!
    "The Action ID that posts will be submitted for."
    actionId: String
    "Optional custom title of the text submission block."
    title: String
    "Optional label for the text field, helping describe or prompt the user regarding what to submit."
    textFieldLabel: String
    "Optional placeholder for the text field, providing an example of what a text submission should look like."
    textFieldPlaceholderMessage: String
    "Optional custom text to display on the submission button."
    buttonText: String
    "Optional custom title for the information block."
    informationTitle: String
    "Optional custom content for the information block."
    informationContent: String
    "Optional content to display once the user successfully submits their petition reportback."
    affirmationContent: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type PetitionSubmissionBlock implements Block {
    "The internal-facing title for this photo submission action."
    internalTitle: String!
    "The Action ID that posts will be submitted for."
    actionId: String
    "Optional custom title of the petition block."
    title: String
    "The petition's content."
    content: String
    "Optional custom placeholder for the petition message text field."
    textFieldPlaceholderMessage: String
    "Optional custom text to display on the submission button."
    buttonText: String
    "Optional custom title for the information block."
    informationTitle: String
    "Optional custom content for the information block."
    informationContent: String
    "Optional content to display once the user successfully submits their petition reportback."
    affirmationContent: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type Query {
    "Get a block by ID."
    block(id: String!): Block
  }
`;

/**
 * Contentful type to GraphQL type mappings.
 *
 * @var {Object}
 */
const contentTypeMappings = {
  embed: 'EmbedBlock',
  imagesBlock: 'ImagesBlock',
  petitionSubmissionAction: 'PetitionSubmissionBlock',
  postGallery: 'PostGalleryBlock',
  textSubmissionAction: 'TextSubmissionBlock',
};

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  JSON: GraphQLJSON,
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Query: {
    block: (_, args, context) => Loader(context).blocks.load(args.id),
  },
  Asset: {
    title: asset => asset.fields.title,
    description: asset => asset.fields.description,
    contentType: asset => asset.fields.file.contentType,
    url: (asset, args) => createImageUrl(asset, args),
  },
  Block: {
    __resolveType: block => get(contentTypeMappings, block.contentType),
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
