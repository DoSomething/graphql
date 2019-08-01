import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import GraphQLJSON from 'graphql-type-json';
import { gql } from 'apollo-server';
import { get } from 'lodash';

import Loader from '../../loader';
import {
  createImageUrl,
  linkResolver,
} from '../../repositories/contentful/phoenix';

const entryFields = `
    "The Contentful ID for this block."
    id: String!
    "The time this entry was last modified."
    updatedAt: DateTime
    "The time when this entry was originally created."
    createdAt: DateTime
`;

//TODO: Add support for metadata reference field

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
    "The unique ID for this Contentful asset."
    id: String!
    "Title for this asset."
    title: String
    "Description for this asset."
    description: String
    "Mime-type for this asset."
    contentType: String,
    "The URL where this file is available at."
    url(w: Int, h: Int, fit: ResizeOption): AbsoluteUrl,
  }

  type CampaignWebsite {
    "The internal-facing title for this campaign."
    internalTitle: String!
    "The user-facing title for this campaign."
    title: String!
    "The slug for this campaign."
    slug: String!
    ${entryFields}
  }

  type ImagesBlock implements Block {
    "The images to be included in this block."
    images: [Asset]
    ${entryFields}
  }

  type PersonBlock implements Block {
    "Name of the person displayed on the block"
    name: String
    "The person's position within the organization"
    type: String
    "The person's relationship with the organization: active? non-active?"
    active: Boolean
    "Job title of the person"
    jobTitle: String
    "Photo of the person"
    photo: Asset
    "Alternate Photo of the person"
    alternatePhoto: Asset
    "Description of the person"
    description: String
    ${entryFields}
  }

  type EmbedBlock implements Block {
    "The URL of the content to be embedded."
    url: String!
    "A preview image of the embed content. If set, replaces the embed on smaller screens."
    previewImage: Asset
    ${entryFields}
  }

  type PostGalleryBlock implements Block {
    "The internal-facing title for this gallery."
    internalTitle: String!
    "The list of Action IDs to show in this gallery."
    actionIds: [Int]!
    "The maximum number of items in a single row when viewing the gallery in a large display."
    itemsPerRow: Int
    "A filter type which users can select to filter the gallery."
    filterType: String
    "Hide the post reactions for this gallery"
    hideReactions: Boolean
    ${entryFields}
  }

  type GalleryBlock implements Block {
    "The internal-facing title for this gallery."
    internalTitle: String!
    "Title of the gallery"
    title: String
    "The maximum number of items in a single row when viewing the gallery in a large display."
    itemsPerRow: Int!
    "The alignment of the gallery images relative to their text content"
    imageAlignment: String!
    "Blocks to display or preview in the Gallery"
    blocks: [Block]!
    "Controls the cropping method of the gallery images"
    imageFit: String
    ${entryFields}
  }

  type LinkBlock implements Block {
    "The internal-facing title for this link block."
    internalTitle: String!
    "The user-facing title for this link block."
    title: String
    "Optional description of the link."
    content: String
    "The URL being linked to."
    link: AbsoluteUrl
    "Optional custom text to display on the submission button."
    buttonText: String
    "The logo of the partner or sponsor for this link action."
    affiliateLogo: Asset
    "The template to be used for this link action."
    template: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type ContentBlock implements Block {
    "The internal-facing title for this link block."
    internalTitle: String!
    "An optional supporting super-title"
    superTitle: String
    "The user-facing title of the block"
    title: String!
    "A subtitle for the content block"
    subTitle: String
    "The content for the content block"
    content: String!
    "An optional Image to display next to the content"
    image: Asset
    "The alignment of the image"
    imageAlignment: String
    ${entryFields}
  }

  type PhotoSubmissionBlock implements Block {
    "The internal-facing title for this photo submission action."
    internalTitle: String!
    "The Action ID that posts will be submitted for."
    actionId: Int
    "Optional custom title of the text submission block."
    title: String
    "Optional label for the caption field, helping describe or prompt the user regarding what to submit."
    captionFieldLabel: String
    "Optional placeholder for the caption field, providing an example of what a text submission should look like."
    captionFieldPlaceholderMessage: String
    "Should the form ask for the quantity of items in member's photo submission?"
    showQuantityField: Boolean
    "Optional label for the quantity field."
    quantityFieldLabel: String
    "Optional placeholder for the quantity field."
    quantityFieldPlaceholder: String
    "Optional label for the 'why participated' field."
    whyParticipatedFieldLabel: String
    "Optional placeholder for the 'why participated' field."
    whyParticipatedFieldPlaceholder: String
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

  type ShareBlock implements Block {
    "The internal-facing title for this share block."
    internalTitle: String!
    "The Action ID that 'share' posts will be submitted for."
    actionId: Int
    "The user-facing title for this share block."
    title: String
    "The social platform that should be offered for sharing this link."
    socialPlatform: [String]
    "Optional description of the link."
    content: String
    "The URL being linked to."
    link: AbsoluteUrl
    "This will hide the link preview 'embed' on the share action."
    hideEmbed: Boolean
    "This block should be displayed in a modal after a successful share."
    affirmationBlock: Block
    "A quick text-only affirmation message. Ignored if an affirmation block is set."
    affirmation: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type TextSubmissionBlock implements Block {
    "The internal-facing title for this text submission action."
    internalTitle: String!
    "The Action ID that posts will be submitted for."
    actionId: Int
    "Optional custom title of the text submission block."
    title: String
    "Optional label for the text field, helping describe or prompt the user regarding what to submit."
    textFieldLabel: String
    "Optional placeholder for the text field, providing an example of what a text submission should look like."
    textFieldPlaceholderMessage: String  @deprecated(reason: "Use 'textFieldPlaceholder' instead.")
    "Optional placeholder for the text field, providing an example of what a text submission should look like."
    textFieldPlaceholder: String
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
    "The internal-facing title for this petition submission block."
    internalTitle: String!
    "The Action ID that posts will be submitted for."
    actionId: Int
    "Optional custom title of the petition block."
    title: String
    "The petition's content."
    content: String
    "Optional custom placeholder for the petition message text field."
    textFieldPlaceholder: String
    "Optional custom placeholder for the petition message text field."
    textFieldPlaceholderMessage: String  @deprecated(reason: "Use 'textFieldPlaceholder' instead.")
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

  type VoterRegistrationBlock implements Block {
    "The internal-facing title for this voter registration block."
    internalTitle: String!
    "The user-facing title for this voter registration block."
    title: String
    "The voter registration block's text content."
    content: String
    "The link to the appropriate Instapage or partner flow."
    link: AbsoluteUrl
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type PageBlock implements Block {
    "This title is used internally to help find this content."
    internalTitle: String!
    "Text displayed big at the top of the page."
    title: String!
    "Text directly below the title in a smaller font."
    subTitle: String
    "The slug for this page."
    slug: String!
    "Person writing the content of the page."
    authors: [Block]
    "The cover image will display on the page before the content."
    coverImage: [Asset]
    "Text displayed on the page"
    content: String
    "Add blocks to show up on alongside the main content."
    sidebar: [Block]
    "Blocks to display on the page."
    blocks: [Block]
    "Select 'Yes' to display Social Sharing buttons on the bottom of the page. (Facebook & Twitter)."
    displaySocialShare: Boolean
    "Hide the page from the navigation."
    hideFromNavigation: Boolean
    ${entryFields}
  }

  type AffiliateBlock implements Block {
    "The internal-facing title for this affiliate block."
    internalTitle: String!
    "The title for this affiliate."
    title: String!
    "The link to the affiliate's website."
    link: String
    "The affiliate's logo."
    logo: Asset
    "The affiliate's UTM label."
    utmLabel: String
    ${entryFields}
  }

  type Query {
    "Get a block by ID."
    block(id: String!, preview: Boolean = false): Block
    "Get an asset by ID."
    asset(id: String!, preview: Boolean = false): Asset
    affiliate(utmLabel: String!, preview: Boolean = false): AffiliateBlock
    campaignWebsite(id: String!, preview: Boolean = false): CampaignWebsite
    campaignWebsiteByCampaignId(campaignId: String!, preview: Boolean = false): CampaignWebsite
  }
`;

/**
 * Contentful type to GraphQL type mappings.
 *
 * @var {Object}
 */
const contentTypeMappings = {
  affiliates: 'AffiliateBlock',
  campaignWebsite: 'CampaignWebsite',
  embed: 'EmbedBlock',
  contentBlock: 'ContentBlock',
  galleryBlock: 'GalleryBlock',
  imagesBlock: 'ImagesBlock',
  linkAction: 'LinkBlock',
  person: 'PersonBlock',
  petitionSubmissionAction: 'PetitionSubmissionBlock',
  photoSubmissionAction: 'PhotoSubmissionBlock',
  postGallery: 'PostGalleryBlock',
  shareAction: 'ShareBlock',
  textSubmissionAction: 'TextSubmissionBlock',
  voterRegistrationAction: 'VoterRegistrationBlock',
  page: 'PageBlock',
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
    block: (_, { id, preview }, context) =>
      Loader(context, preview).blocks.load(id),
    asset: (_, { id, preview }, context) =>
      Loader(context, preview).assets.load(id),
    affiliate: (_, { utmLabel, preview }, context) =>
      Loader(context, preview).affiliates.load(utmLabel),
    campaignWebsite: (_, { id, preview }, context) =>
      Loader(context, preview).campaignWebsites.load(id),
    campaignWebsiteByCampaignId: (_, { campaignId, preview }, context) =>
      Loader(context, preview).campaignWebsiteByCampaignIds.load(campaignId),
  },
  Asset: {
    url: (asset, args) => createImageUrl(asset, args),
  },
  Block: {
    __resolveType: block => get(contentTypeMappings, block.contentType),
  },
  ContentBlock: {
    image: linkResolver,
  },
  TextSubmissionBlock: {
    textFieldPlaceholderMessage: block => block.textFieldPlaceholder,
  },
  PetitionSubmissionBlock: {
    textFieldPlaceholderMessage: block => block.textFieldPlaceholder,
  },
  ShareBlock: {
    affirmationBlock: linkResolver,
  },
  LinkBlock: {
    affiliateLogo: linkResolver,
  },
  GalleryBlock: {
    blocks: linkResolver,
  },
  ImagesBlock: {
    images: linkResolver,
  },
  PersonBlock: {
    photo: linkResolver,
    alternatePhoto: linkResolver,
  },
  EmbedBlock: {
    previewImage: linkResolver,
  },
  PageBlock: {
    authors: linkResolver,
    coverImage: linkResolver,
    sidebar: linkResolver,
    blocks: linkResolver
  },
  AffiliateBlock: {
    logo: linkResolver,
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
