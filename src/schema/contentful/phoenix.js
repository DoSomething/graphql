import { makeExecutableSchema } from 'graphql-tools';
import { GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import GraphQLJSON from 'graphql-type-json';
import { gql } from 'apollo-server';
import { get, first } from 'lodash';

import Loader from '../../loader';
import { stringToEnum, listToEnums } from '../helpers';
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

  interface Showcasable {
    "The showcase title"
    showcaseTitle: String
    "The showcase description"
    showcaseDescription: String
    "The showcase image"
    showcaseImage: Asset
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

  type CampaignWebsite implements Showcasable {
    "The internal-facing title for this campaign."
    internalTitle: String!
    "The user-facing title for this campaign."
    title: String!
    "The slug for this campaign."
    slug: String!
     "The call to action tagline for this campaign."
    callToAction: String!
    "The cover image for this campaign."
    coverImage: Asset
    "The showcase title (the title field.)"
    showcaseTitle: String!
    "The showcase description (the callToAction field.)"
    showcaseDescription: String!
    "The showcase image (the coverImage field.)"
    showcaseImage: Asset
    ${entryFields}
  }

  enum CallToActionStyle {
    LIGHT
    DARK
    TRANSPARENT
  }

  type CallToActionBlock implements Block {
    "The visual treatment to apply to this block."
    visualStyle: CallToActionStyle
    "Use the campaign tagline as the first line of the CTA (if on a campaign page)."
    useCampaignTagline: Boolean
    "The content of the call to action."
    content: String
    "The content to display before the impact value."
    impactPrefix: String
    "The emphasized 'impact' value."
    impactValue: String
    "The content to display after the impact value."
    impactSuffix: String
    "The button text."
    actionText: String
    ${entryFields}
  }

  type Page implements Showcasable {
    "This title is used internally to help find this content."
    internalTitle: String!
    "The title for this page."
    title: String!
    "The subtitle for this page."
    subTitle: String
    "The slug for this page."
    slug: String!
    "Cover image for this page."
    coverImage: Asset
    "The content of the page."
    content: String
    "Sidebar blocks rendered alongside the content on the page."
    sidebar: [Block]
    "Blocks rendered following the content on the page."
    blocks: [Block]
    "Should we display social share buttons on the bottom of the page?"
    displaySocialShare: Boolean
    "Should we hide the page from the navigation bar? (for campaign pages.)"
    hideFromNavigation: Boolean
    "The Showcase title (the title field.)"
    showcaseTitle: String!
    "The Showcase description (the content field.)"
    showcaseDescription: String
    "The Showcase image (the coverImage field.)"
    showcaseImage: Asset
    "Any custom overrides for this block."
    additionalContent: JSON
    ${entryFields}
  }

  type CausePage {
    "The slug for this cause page."
    slug: String!
    "The cover image for this cause page."
    coverImage: Asset!
    "The supertitle (or title prefix)."
    superTitle: String!
    "The title."
    title: String!
    "The description, in Rich Text."
    description: JSON!
    "The content, in Rich Text."
    content: JSON!
    ${entryFields}
  }

  type CollectionPage {
    "The slug for this collection page."
    slug: String!
    "The cover image for this collection page."
    coverImage: Asset!
    "The supertitle (or title prefix)."
    superTitle: String!
    "The title."
    title: String!
    "The description, in Rich Text."
    description: JSON!
    "The prefix intro for the displayed affiliates."
    affiliatePrefix: String
    "The list of affiliates for this collection page."
    affiliates: [AffiliateBlock]
    "The content, in Rich Text."
    content: JSON!
    ${entryFields}
  }

  type ImagesBlock implements Block {
    "The images to be included in this block."
    images: [Asset]
    ${entryFields}
  }

  type PersonBlock implements Showcasable & Block {
    "Name of the person displayed on the block."
    name: String!
    "The person's relationship with the organization: member? employee?"
    type: String!
    "The status of the person's relationship with the organization: active? non-active?"
    active: Boolean!
    "Job title of the person."
    jobTitle: String
    "The perons's email address."
    email: String
    "The person's Twitter handle."
    twitterId: String
    "Photo of the person."
    photo: Asset
    "Alternate Photo of the person."
    alternatePhoto: Asset
    "Description of the person."
    description: String
    "The Showcase title (the name field.)"
    showcaseTitle: String!
    "The Showcase description ('description' if the person is a board member and 'jobTitle' by default.)"
    showcaseDescription: String
    "The Showcase image ('photo' if the person is an advisory board member 'alternatePhoto' by default.)"
    showcaseImage: Asset
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
    itemsPerRow: Int!
    "A filter type which users can select to filter the gallery."
    filterType: String
    "Hide the post reactions for this gallery."
    hideReactions: Boolean
    ${entryFields}
  }

  enum GalleryImageFitOption {
    FILL
    PAD
  }

  enum GalleryImageAlignmentOption {
    TOP
    LEFT
  }

  type GalleryBlock implements Block {
    "The internal-facing title for this gallery."
    internalTitle: String!
    "Title of the gallery."
    title: String
    "The maximum number of items in a single row when viewing the gallery in a large display."
    itemsPerRow: Int!
    "The alignment of the gallery images relative to their text content."
    imageAlignment: GalleryImageAlignmentOption!
    "Blocks to display or preview in the Gallery."
    blocks: [Showcasable]!
    "Controls the cropping method of the gallery images."
    imageFit: GalleryImageFitOption
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

  enum ContentImageAlignmentOption {
    LEFT
    RIGHT
  }

  type ContentBlock implements Block & Showcasable {
    "The internal-facing title for this link block."
    internalTitle: String!
    "An optional supporting super-title."
    superTitle: String
    "The user-facing title of the block."
    title: String
    "A subtitle for the content block."
    subTitle: String
    "The content for the content block."
    content: String!
    "An optional Image to display next to the content."
    image: Asset
    "The alignment of the image."
    imageAlignment: ContentImageAlignmentOption
    "The Showcase title (the title field.)"
    showcaseTitle: String
    "The Showcase description (the content field.)"
    showcaseDescription: String!
    "The Showcase image (the image field.)"
    showcaseImage: Asset
    "Any custom overrides for this block."
    additionalContent: JSON
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
    page(id: String!, preview: Boolean = false): Page
    campaignWebsiteByCampaignId(campaignId: String!, preview: Boolean = false): CampaignWebsite
    causePageBySlug(slug: String!, preview: Boolean = false): CausePage
    collectionPageBySlug(slug: String!, preview: Boolean = false): CollectionPage
  }
`;

/**
 * Contentful type to GraphQL type mappings.
 *
 * @var {Object}
 */
const contentTypeMappings = {
  affiliates: 'AffiliateBlock',
  campaign: 'CampaignWebsite',
  callToAction: 'CallToActionBlock',
  page: 'Page',
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
  causePage: 'CausePage',
  collectionPage: 'CollectionPage',
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
    causePageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).causePagesBySlug.load(slug),
    collectionPageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).collectionPagesBySlug.load(slug),
    page: (_, { id, preview }, context) =>
      Loader(context, preview).pages.load(id),
  },
  Asset: {
    url: (asset, args) => createImageUrl(asset, args),
  },
  Block: {
    __resolveType: block => get(contentTypeMappings, block.contentType),
  },
  Showcasable: {
    __resolveType: showcasable =>
      get(contentTypeMappings, showcasable.contentType),
  },
  CallToActionBlock: {
    visualStyle: block => first(listToEnums(block.visualStyle)) || 'DARK',
  },
  ContentBlock: {
    image: linkResolver,
    imageAlignment: block => stringToEnum(block.imageAlignment),
    showcaseTitle: content => content.title,
    showcaseDescription: content => content.content,
    showcaseImage: (person, _, context, info) =>
      linkResolver(person, _, context, info, 'image'),
  },
  CampaignWebsite: {
    coverImage: linkResolver,
    showcaseTitle: campaign => campaign.title,
    showcaseDescription: campaign => campaign.callToAction,
    showcaseImage: (person, _, context, info) =>
      linkResolver(person, _, context, info, 'coverImage'),
  },
  CausePage: {
    coverImage: linkResolver,
  },
  CollectionPage: {
    coverImage: linkResolver,
    affiliates: linkResolver,
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
    imageAlignment: block => stringToEnum(block.imageAlignment),
    imageFit: block => stringToEnum(block.imageFit),
  },
  ImagesBlock: {
    images: linkResolver,
  },
  PersonBlock: {
    photo: linkResolver,
    alternatePhoto: linkResolver,
    showcaseTitle: person => person.name,
    showcaseDescription: person =>
      person.type.includes('board member')
        ? person.description
        : person.jobTitle,
    showcaseImage: (person, _, context, info) => {
      const fieldName =
        person.type === 'advisory board member' ? 'photo' : 'alternatePhoto';
      return linkResolver(person, _, context, info, fieldName);
    },
  },
  EmbedBlock: {
    previewImage: linkResolver,
  },
  Page: {
    coverImage: linkResolver,
    showcaseTitle: page => page.title,
    showcaseDescription: page => page.subTitle,
    showcaseImage: (page, _, context, info) =>
      linkResolver(page, _, context, info, 'coverImage'),
    blocks: linkResolver,
    sidebar: linkResolver,
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
