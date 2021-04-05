import { get, first, truncate } from 'lodash';
import { DateTimeResolver, JSONResolver, URLResolver } from 'graphql-scalars';
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer';

import Loader from '../../loader';
import config from '../../../config';
import { stringToEnum, listToEnums } from '../helpers';
import {
  getArticlesPage,
  getHomePage,
  linkResolver,
  createImageUrl,
  parseQuizResults,
  parseQuizQuestions,
} from '../../repositories/contentful/phoenix';

/**
 * Contentful type to GraphQL type mappings.
 *
 * @var {Object}
 */
const contentTypeMappings = {
  actionStatsBlock: 'ActionStatsBlock',
  affiliates: 'AffiliateBlock',
  affirmation: 'AffirmationBlock',
  articlesPage: 'ArticlesPage',
  callToAction: 'CallToActionBlock',
  campaign: 'CampaignWebsite',
  campaignDashboard: 'CampaignDashboard',
  campaignUpdate: 'CampaignUpdateBlock',
  causePage: 'CausePage',
  collectionPage: 'CollectionPage',
  companyPage: 'CompanyPage',
  contentBlock: 'ContentBlock',
  currentSchoolBlock: 'CurrentSchoolBlock',
  currentClubBlock: 'CurrentClubBlock',
  embed: 'EmbedBlock',
  galleryBlock: 'GalleryBlock',
  homePage: 'HomePage',
  imagesBlock: 'ImagesBlock',
  linkAction: 'LinkBlock',
  page: 'Page',
  person: 'PersonBlock',
  petitionSubmissionAction: 'PetitionSubmissionBlock',
  photoSubmissionAction: 'PhotoSubmissionBlock',
  postGallery: 'PostGalleryBlock',
  questionnaireAction: 'QuestionnaireBlock',
  quiz: 'QuizBlock',
  sectionBlock: 'SectionBlock',
  selectionSubmissionAction: 'SelectionSubmissionBlock',
  shareAction: 'ShareBlock',
  signupReferralsBlock: 'SignupReferralsBlock',
  sixpackExperiment: 'SixpackExperimentBlock',
  socialDriveAction: 'SocialDriveBlock',
  softEdgeWidgetAction: 'SoftEdgeBlock',
  storyPage: 'StoryPageWebsite',
  textSubmissionAction: 'TextSubmissionBlock',
  voterRegistrationAction: 'VoterRegistrationBlock',
  voterRegistrationDriveAction: 'VoterRegistrationDriveBlock',
  voterRegistrationReferralsBlock: 'VoterRegistrationReferralsBlock',
  voterRegistrationMarketingPage: 'VoterRegistrationMarketingPage',
  externalLink: 'ExternalLinkBlock',
};

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  JSON: JSONResolver,
  DateTime: DateTimeResolver,
  URL: URLResolver,
  Query: {
    block: (_, { id, preview }, context) =>
      Loader(context, preview).blocks.load(id),
    asset: (_, { id, preview }, context) =>
      Loader(context, preview).assets.load(id),
    affiliate: (_, { utmLabel, preview }, context) =>
      Loader(context, preview).affiliates.load(utmLabel),
    articlesPage: (_, { preview }, context) =>
      getArticlesPage(context, preview),
    campaignWebsite: (_, { id, preview }, context) =>
      Loader(context, preview).campaignWebsites.load(id),
    campaignWebsiteByCampaignId: (_, { campaignId, preview }, context) =>
      Loader(context, preview).campaignWebsiteByCampaignIds.load(campaignId),
    causePageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).causePagesBySlug.load(slug),
    collectionPageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).collectionPagesBySlug.load(slug),
    companyPageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).companyPagesBySlug.load(slug),
    homePage: (_, { preview }, context) => getHomePage(context, preview),
    page: (_, { id, preview }, context) =>
      Loader(context, preview).pages.load(id),
    pageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).pagesBySlug.load(slug),
    storyPageWebsite: (_, { id, preview }, context) =>
      Loader(context, preview).storyPageWebsites.load(id),
    voterRegistrationMarketingPageBySlug: (_, { slug, preview }, context) =>
      Loader(context, preview).voterRegistrationMarketingPageBySlug.load(slug),
  },
  AffiliateBlock: {
    logo: linkResolver,
  },
  AffirmationBlock: {
    author: (person, _, context, info) =>
      linkResolver(person, _, context, info, 'newAuthor'),
  },
  Asset: {
    url: (asset, args) => createImageUrl(asset, args),
  },
  Block: {
    __resolveType: block => get(contentTypeMappings, block.contentType),
  },
  CallToActionBlock: {
    visualStyle: block => first(listToEnums(block.visualStyle)) || 'DARK',
    template: block => stringToEnum(block.template),
    alignment: block => stringToEnum(block.alignment),
  },
  CampaignUpdateBlock: {
    author: linkResolver,
    affiliateLogo: linkResolver,
  },
  CampaignWebsite: {
    affiliateSponsors: linkResolver,
    affirmation: linkResolver,
    campaignId: campaign => campaign.legacyCampaignId,
    coverImage: linkResolver,
    showcaseTitle: campaign => campaign.title,
    showcaseDescription: campaign => campaign.callToAction,
    showcaseImage: (campaign, _, context, info) =>
      linkResolver(campaign, _, context, info, 'coverImage'),
    path: campaign => `/us/campaigns/${campaign.slug}`,
    url: campaign =>
      `${config('services.phoenix.url')}/us/campaigns/${campaign.slug}`,
  },
  CausePage: {
    coverImage: linkResolver,
  },
  CollectionPage: {
    coverImage: linkResolver,
    affiliates: linkResolver,
    showcaseTitle: collectionPage =>
      `${collectionPage.superTitle}: ${collectionPage.title}`,
    showcaseDescription: collectionPage =>
      truncate(documentToPlainTextString(collectionPage.description), {
        length: 50,
      }),
    showcaseImage: (collectionPage, _, context, info) =>
      linkResolver(collectionPage, _, context, info, 'coverImage'),
    path: collectionPage => `/us/collections/${collectionPage.slug}`,
    url: collectionPage =>
      `${config('services.phoenix.url')}/us/collections/${collectionPage.slug}`,
  },
  CompanyPage: {
    coverImage: linkResolver,
  },
  ContentBlock: {
    image: linkResolver,
    imageAlignment: block => stringToEnum(block.imageAlignment),
    showcaseTitle: content => content.title,
    showcaseDescription: content => content.content,
    showcaseImage: (person, _, context, info) =>
      linkResolver(person, _, context, info, 'image'),
  },
  GalleryBlock: {
    blocks: linkResolver,
    galleryType: block => stringToEnum(block.galleryType),
    imageAlignment: block => stringToEnum(block.imageAlignment),
    imageFit: block => stringToEnum(block.imageFit),
  },
  HomePage: {
    coverImage: linkResolver,
    articles: linkResolver,
    campaigns: linkResolver,
    sponsors: linkResolver,
  },
  ImagesBlock: {
    images: linkResolver,
  },
  LinkBlock: {
    affiliateLogo: linkResolver,
  },
  Page: {
    authors: linkResolver,
    coverImage: linkResolver,
    showcaseTitle: page => page.title,
    showcaseDescription: page => page.subTitle,
    showcaseImage: (page, _, context, info) =>
      linkResolver(page, _, context, info, 'coverImage'),
    blocks: linkResolver,
  },
  PersonBlock: {
    photo: linkResolver,
    alternatePhoto: linkResolver,
    internalTitle: person => person.email,
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
  PetitionSubmissionBlock: {
    textFieldPlaceholderMessage: block => block.textFieldPlaceholder,
  },
  ResourceWebsite: {
    __resolveType: block => get(contentTypeMappings, block.contentType),
  },
  Routable: {
    __resolveType: routable => get(contentTypeMappings, routable.contentType),
  },
  SelectionSubmissionBlock: {
    richText: block => block.content,
  },
  ShareBlock: {
    affirmationBlock: linkResolver,
  },
  Showcasable: {
    __resolveType: showcasable =>
      get(contentTypeMappings, showcasable.contentType),
  },
  SixpackExperimentBlock: {
    control: linkResolver,
    alternatives: linkResolver,
    convertableActions: block => listToEnums(block.convertableActions),
  },
  StoryPageWebsite: {
    coverImage: linkResolver,
    blocks: linkResolver,
    showcaseTitle: storyPage => storyPage.title,
    showcaseDescription: storyPage => storyPage.subTitle,
    showcaseImage: (storyPage, _, context, info) =>
      linkResolver(storyPage, _, context, info, 'coverImage'),
    path: storyPage => `/us/${storyPage.slug}`,
    url: storyPage => `${config('services.phoenix.url')}/us/${storyPage.slug}`,
  },
  TextSubmissionBlock: {
    textFieldPlaceholderMessage: block => block.textFieldPlaceholder,
  },
  QuizBlock: {
    resultBlocks: linkResolver,
    defaultResultBlock: linkResolver,
    questions: parseQuizQuestions,
    results: parseQuizResults,
  },
  ExternalLinkBlock: {
    image: linkResolver,
    showcaseTitle: externalLinkBlock => externalLinkBlock.title,
    showcaseDescription: externalLinkBlock => externalLinkBlock.description,
    showcaseImage: (externalLinkBlock, _, context, info) =>
      linkResolver(externalLinkBlock, _, context, info, 'image'),
  },
  VoterRegistrationMarketingPage: {
    coverImage: linkResolver,
    logo: linkResolver,
    content: linkResolver,
  },
};

export default resolvers;
