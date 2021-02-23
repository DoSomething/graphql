import { gql } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';

import resolvers from '../../resolvers/contentful/phoenix';

const blockFields = `
  "The internal-facing title for this block."
  internalTitle: String!
`;

const entryFields = `
  "The Contentful ID for this entry."
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
  scalar URL

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
    ${blockFields}
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

  interface Routable {
    "The root-relative path to this resource. Use when linking internally."
    path: String
    "The full absolute URL to this resource. Use when linking cross-domain."
    url: URL
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
    url(w: Int, h: Int, fit: ResizeOption): URL,
  }

  type ExternalLinkBlock implements Block & Showcasable {
    "Overrides the provider title."
    title: String
    "Overrides the provider description."
    description: String
    "The external URL."
    url: URL!
    "Overrides the provider image"
    image: Asset
    "The showcase title (the title field.)"
    showcaseTitle: String
    "The showcase description (the description field.)"
    showcaseDescription: String
    "The showcase image (the image field.)"
    showcaseImage: Asset
    ${blockFields}
    ${entryFields}
  }

  type CampaignWebsite implements Showcasable & Routable {
    "The internal-facing title for this campaign website."
    internalTitle: String!
    "The user-facing title for this campaign website."
    title: String!
    "The slug for this campaign website."
    slug: String!
    "The root-relative path to this campaign. Use when linking internally."
    path: String
    "The full absolute URL to this campaign. Use when linking cross-domain."
    url: URL
    "The block to display after a user signs up for a campaign."
    affirmation: Block
    "The call to action tagline for this campaign."
    callToAction: String!
     "The campaign ID associated with this campaign website."
    campaignId: Int!
    "The cover image for this campaign."
    coverImage: Asset
     "The scholarship amount associated with this campaign."
    scholarshipAmount: Int
     "The scholarship deadline datetime string associated with this campaign."
    scholarshipDeadline: String
    "Designates if this is a staff pick campaign."
    staffPick: Boolean
    "The showcase title (the title field.)"
    showcaseTitle: String!
    "The showcase description (the callToAction field.)"
    showcaseDescription: String!
    "The showcase image (the coverImage field.)"
    showcaseImage: Asset
    "The affiliate sponsors for this campaign."
    affiliateSponsors: [AffiliateBlock]
    "Any custom overrides for this campaign page."
    additionalContent: JSON
    ${entryFields}
  }

  type CompanyPage {
    "The internal-facing title for this company page."
    internalTitle: String!
    "The slug for this company page."
    slug: String!
    "The user-facing title for this company page."
    title: String!
    "The subtitle for this page."
    subTitle: String
    "The cover image for this company page."
    coverImage: Asset
    "The Rich Text content for this company page."
    content: JSON!
    ${entryFields}
  }

  type StoryPageWebsite implements Showcasable & Routable {
    "The internal-facing title for this story campaign."
    internalTitle: String!
    "The slug for this story campaign."
    slug: String!
    "The root-relative path to this story page. Use when linking internally."
    path: String
    "The full absolute URL to this story page. Use when linking cross-domain."
    url: URL
    "The user-facing title for this story campaign."
    title: String!
    "The user-facing subtitle for this story campaign."
    subTitle: String
    "The cover image for this story campaign."
    coverImage: Asset
    "Blocks rendered following the initial content on the story campaign."
    blocks: [Block]
    "The showcase title (the title field.)"
    showcaseTitle: String!
    "The showcase description (the subTitle field.)"
    showcaseDescription: String!
    "The showcase image (the coverImage field.)"
    showcaseImage: Asset
    "Any custom overrides for this cause page."
    additionalContent: JSON
    ${entryFields}
  }

  enum CallToActionStyle {
    LIGHT
    DARK
    TRANSPARENT
  }

  type ActionStatsBlock implements Block {
    "The action ID to display a leaderboard for."
    actionId: Int!
    "The group type ID to filter stats by."
    groupTypeId: Int
    ${blockFields}
    ${entryFields}
  }

  type AffirmationBlock implements Block {
    "The title displayed on this card."
    header: String
    "The quote displayed in the block."
    quote: String
    "The author to attribute the quote to."
    author: PersonBlock
    "The heading for the share action on this block."
    callToActionHeader: String
    "The description for the share action on this block."
    callToActionDescription: String
    ${blockFields}
    ${entryFields}
  }

  enum CallToActionTemplate {
    PURPLE
    YELLOW
    VOTER_REGISTRATION
  }

  enum CallToActionAlignment {
    LEFT
    CENTER
  }

  type CallToActionBlock implements Block {
    "The small title above the main CTA title"
    superTitle: String
    "The main, large title of the CTA"
    title: String
    "The paragraph that follows the title."
    content: String
    "The text label of the CTA button"
    linkText: String
    "The destination of the CTA link"
    link: String
    "The visual style of the CTA block"
    template: CallToActionTemplate
    "The alignment of all the text in the CTA block"
    alignment: CallToActionAlignment
    "The visual treatment to apply to this block."
    visualStyle: CallToActionStyle @deprecated(reason: "Outdated component pieces")
    "Use the campaign tagline as the first line of the CTA (if on a campaign page)."
    useCampaignTagline: Boolean @deprecated(reason: "Outdated component pieces")
    "The content to display before the impact value."
    impactPrefix: String @deprecated(reason: "Outdated component pieces")
    "The emphasized 'impact' value."
    impactValue: String @deprecated(reason: "Outdated component pieces")
    "The content to display after the impact value."
    impactSuffix: String @deprecated(reason: "Outdated component pieces")
    "The button text."
    actionText: String @deprecated(reason: "Outdated component pieces")
    ${blockFields}
    ${entryFields}
  }

  type CampaignDashboard implements Block {
    "Heading for the share section of the dashboard."
    shareHeader: String
    "Copy for the share section of the dashboard."
    shareCopy: String
    "The first dashboard value presented, likely a number."
    firstValue: String
    "A short description of the first value."
    firstDescription: String
    "The second dashboard value presented, likely a number."
    secondValue: String
    "A short description of the second value."
    secondDescription: String
    ${blockFields}
    ${entryFields}
  }

  type CampaignUpdateBlock implements Block {
    "The content of the campaign update."
    content: String
    "Optionally, a link to embed within the campaign update."
    link: URL
    "The author to attribute the campaign update to."
    author: PersonBlock
    "The logo of the partner or sponsor that should be highlighted for this update."
    affiliateLogo: Asset
    ${blockFields}
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
    "The authors for this page."
    authors: [PersonBlock]
    "The content of the page."
    content: String
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
    "The Rich Text description."
    description: JSON!
    "The Rich Text content."
    content: JSON!
    "Any custom overrides for this cause page."
    additionalContent: JSON
    ${entryFields}
  }

  type CollectionPage implements Showcasable & Routable {
    "The slug for this collection page."
    slug: String!
    "The root-relative path to this collection page. Use when linking internally."
    path: String
    "The full absolute URL to this collection page. Use when linking cross-domain."
    url: URL
    "The cover image for this collection page."
    coverImage: Asset!
    "The supertitle (or title prefix)."
    superTitle: String!
    "The title."
    title: String!
    "The Rich Text description."
    description: JSON!
    "The prefix intro for the displayed affiliates."
    affiliatePrefix: String
    "The list of affiliates for this collection page."
    affiliates: [AffiliateBlock]
    "The Rich Text content."
    content: JSON!
    "The Showcase title (the superTitle + title field)."
    showcaseTitle: String!
    "The Showcase description (the Rich Text description field converted to plain text)."
    showcaseDescription: String!
    "The Showcase image (the coverImage field)."
    showcaseImage: Asset!
    "Any custom overrides for this collection page."
    additionalContent: JSON
    ${entryFields}
  }

  type VoterRegistrationMarketingPage {
    "This title is used internally to help find this content."
    internalTitle: String!
    "The slug for this page."
    slug: String!
    "The cover image for this page."
    coverImage: Asset!
    "The banner background color."
    bannerBackgroundColor: String
    "Logo displayed on this page."
    logo: Asset
    "The title."
    title: String!
    "The custom color for the title."
    titleColor: String
    "The subtitle"
    subTitle: String!
    "The custom color for the subtitle"
    subTitleColor: String
    "Custom text for the Voter Registration form submission button."
    voterRegistrationFormButtonText: String
    "Custom background color for the Voter Registration form submission button."
    voterRegistrationFormButtonColor: String
    "The value for the source parameter in the Rock The Vote Redirect URL."
    source: String
    "The value for the source_details parameter in the Rock The Vote Redirect URL."
    sourceDetails: String
    "The content for this page."
    content: SectionBlock!
    ${entryFields}
  }

  type HomePage {
    "This title is used internally to help find this content."
    internalTitle: String!
    "The title for the home page."
    title: String!
    "Cover image for the home page."
    coverImage: Asset
    "Campaigns (campaign and story page entries) rendered as a list on the home page."
    campaigns: [ResourceWebsite]
    "Articles (page entries) rendered as a list on the home page."
    articles: [Page]
    "Any custom overrides for the home page."
    additionalContent: JSON
    "The sponsored affiliates."
    sponsors: [AffiliateBlock]
    ${entryFields}
  }

  type ImagesBlock implements Block {
    "The images to be included in this block."
    images: [Asset]
    ${blockFields}
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
    ${blockFields}
    ${entryFields}
  }

  type EmbedBlock implements Block {
    "The URL of the content to be embedded."
    url: String!
    ${blockFields}
    ${entryFields}
  }

  type PostGalleryBlock implements Block {
    "The list of Action IDs to show in this gallery."
    actionIds: [Int]!
    "The maximum number of items in a single row when viewing the gallery in a large display."
    itemsPerRow: Int!
    "A filter type which users can select to filter the gallery."
    filterType: String
    "Hide the post reactions for this gallery."
    hideReactions: Boolean
    ${blockFields}
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

  enum GalleryTypeOption {
    PERSON
    CAMPAIGN
    SCHOLARSHIP
    PAGE
    CONTENT_BLOCK
    EXTERNAL_LINK
  }

  type GalleryBlock implements Block {
    "Title of the gallery."
    title: String
    "The maximum number of items in a single row when viewing the gallery in a large display."
    itemsPerRow: Int!
    "The alignment of the gallery images relative to their text content."
    imageAlignment: GalleryImageAlignmentOption!
    "The type of blocks to be rendered in the gallery."
    galleryType: GalleryTypeOption
    "Blocks to display or preview in the Gallery."
    blocks: [Showcasable]!
    "Controls the cropping method of the gallery images."
    imageFit: GalleryImageFitOption
    ${blockFields}
    ${entryFields}
  }

  type LinkBlock implements Block {
    "The user-facing title for this link block."
    title: String!
    "Optional description of the link."
    content: String
    "The URL (or tel: number) being linked to."
    # @TODO: Update this value to be some combination of URL and valid 'tel:' String.
    link: String!
    "Optional custom text to display on the submission button."
    buttonText: String
    "The logo of the partner or sponsor for this link action."
    affiliateLogo: Asset
    "The template to be used for this link action."
    template: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${blockFields}
    ${entryFields}
  }

  enum ContentImageAlignmentOption {
    LEFT
    RIGHT
  }

  type ContentBlock implements Block & Showcasable {
    "An optional supporting super-title."
    superTitle: String
    "The user-facing title of the block."
    title: String
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
    ${blockFields}
    ${entryFields}
  }

  type CurrentSchoolBlock implements Block {
    "The Action ID to display aggregate school impact for."
    actionId: Int
    "The title to show for the school selection form."
    selectSchoolTitle: String
    "The instructions to show for the school selection form."
    selectSchoolDescription: String
    "The title to show for the school impact block."
    currentSchoolTitle: String
    "The text text to show for the school impact block."
    currentSchoolDescription: String
    "The text to show if a user's school is not available."
    schoolNotAvailableDescription: String
    ${blockFields}
    ${entryFields}
  }

  type CurrentClubBlock implements Block {
    ${blockFields}
    ${entryFields}
  }

  type PhotoSubmissionBlock implements Block {
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
    "Optional label for the 'number_of_participants' field. If empty, this field will be omitted."
    numberOfParticipantsFieldLabel: String
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
    ${blockFields}
    ${entryFields}
  }

  type QuizBlock implements Block {
    "The user-facing title for this quiz."
    title: String
    "The URL slug for this quiz."
    slug: String!
    autoSubmit: Boolean!
    "Hide pre-titles (i.e. 'Question One') from all questions."
    hideQuestionNumber: Boolean
    "The quiz structure."
    results: JSON
    "Blocks to display for different quiz results."
    resultBlocks: [Block]
    "The default quiz result block."
    defaultResultBlock: Block
    "The quiz questions."
    questions: JSON
    "Any custom overrides for this block."
    additionalContent: JSON
    ${blockFields}
    ${entryFields}
  }

  type SectionBlock implements Block {
    "The hexadecimal background color for this section."
    backgroundColor: String
    "The hexadecimal text color for this section."
    textColor: String
    "The content, in Rich Text."
    content: JSON!
    ${blockFields}
    ${entryFields}
  }

  "Types of events that can count as conversions for Sixpack Experiment blocks."
  enum SixpackConversionEvent {
    SIGNUP
    REPORTBACK_POST
  }

  type SixpackExperimentBlock implements Block {
    "This (optional) block should be used as the control in the experiment."
    control: Block
    "The test alternatives for this experiment."
    alternatives: [Block]!
    "The actions that will count as a conversion for this experiment."
    convertableActions: [SixpackConversionEvent]
    "The percent of traffic to run the experiment on, from 1 - 100."
    trafficFraction: Int
    "The KPI to associate with this experiment."
    kpi: String
    ${blockFields}
    ${entryFields}
  }

  type SelectionSubmissionBlock implements Block {
    "The Rogue action ID for this submission block."
    actionId: Int
    "The user-facing title for this share block."
    title: String
    "The content, in Rich Text."
    content: JSON!
    "The content, in Rich Text. This is an alias for 'content'."
    richText: JSON!
    "The label displayed above the selection field."
    selectionFieldLabel: String
    "The selection options for the selection block."
    selectionOptions: [String]
    "The placeholder selection value."
    selectionPlaceholderOption: String
    "Text to display on the submission button."
    buttonText: String
    "The text displayed under the user selection, post submission."
    postSubmissionLabel: String!
    ${blockFields}
    ${entryFields}
  }

  type SocialDriveBlock implements Block {
    "The link for this social drive, with dynamic string tokens."
    link: URL
    "The user-facing title for this social drive block."
    title: String
    "The user-facing description for this social drive block."
    description: String
    ${blockFields}
    ${entryFields}
  }

  type SoftEdgeBlock implements Block {
    "The user-facing title for this block."
    title: String
    "The Rogue action ID for this submission block."
    actionId: Int
    "The SoftEdge campaign ID for this submission block."
    softEdgeId: Int!
    ${blockFields}
    ${entryFields}
  }

  type ShareBlock implements Block {
    "The Action ID that 'share' posts will be submitted for."
    actionId: Int
    "The user-facing title for this share block."
    title: String
    "The social platform that should be offered for sharing this link."
    socialPlatform: [String]
    "Optional description of the link."
    content: String
    "The URL being linked to."
    link: URL
    "This will hide the link preview 'embed' on the share action."
    hideEmbed: Boolean
    "This block should be displayed in a modal after a successful share."
    affirmationBlock: Block
    "A quick text-only affirmation message. Ignored if an affirmation block is set."
    affirmation: String
    "Any custom overrides for this block."
    additionalContent: JSON
    ${blockFields}
    ${entryFields}
  }

  type TextSubmissionBlock implements Block {
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
    ${blockFields}
    ${entryFields}
  }

  type PetitionSubmissionBlock implements Block {
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
    ${blockFields}
    ${entryFields}
  }

  type SignupReferralsBlock implements Block {
    "The user-facing title for this signup referrals block."
    title: String
    ${blockFields}
    ${entryFields}
  }

  type VoterRegistrationBlock implements Block {
    "The user-facing title for this voter registration block."
    title: String
    "The voter registration block's text content."
    content: String
    "The link to the appropriate Instapage or partner flow."
    link: URL
    "Any custom overrides for this block."
    additionalContent: JSON
    ${blockFields}
    ${entryFields}
  }

  type VoterRegistrationDriveBlock implements Block {
    "The user-facing title for this voter registration drive block."
    title: String
    "The user-facing description for this voter registration drive block."
    description: String
    ${blockFields}
    ${entryFields}
  }

  type VoterRegistrationReferralsBlock implements Block {
    "The user-facing title for this voter registration referrals block."
    title: String
    ${blockFields}
    ${entryFields}
  }

  type AffiliateBlock implements Block {
    "The title for this affiliate."
    title: String!
    "The link to the affiliate's website."
    link: String
    "The affiliate's logo."
    logo: Asset
    "The affiliate's UTM label."
    utmLabel: String
    ${blockFields}
    ${entryFields}
  }

  "A web-based campaign interface, such as the traditional campaign template, story page, or collection page."
  union ResourceWebsite = CampaignWebsite | StoryPageWebsite | CollectionPage

  type Query {
    "Get a block by ID."
    block(id: String!, preview: Boolean = false): Block
    "Get an asset by ID."
    asset(id: String!, preview: Boolean = false): Asset
    affiliate(utmLabel: String!, preview: Boolean = false): AffiliateBlock
    campaignWebsite(id: String!, preview: Boolean = false): CampaignWebsite
    page(id: String!, preview: Boolean = false): Page
    pageBySlug(slug: String!, preview: Boolean = false): Page
    campaignWebsiteByCampaignId(campaignId: String!, preview: Boolean = false): CampaignWebsite
    causePageBySlug(slug: String!, preview: Boolean = false): CausePage
    collectionPageBySlug(slug: String!, preview: Boolean = false): CollectionPage
    companyPageBySlug(slug: String!, preview: Boolean = false): CompanyPage
    homePage(preview: Boolean = false): HomePage
    storyPageWebsite(id: String!, preview: Boolean = false): StoryPageWebsite
    voterRegistrationMarketingPageBySlug(slug: String!, preview: Boolean = false): VoterRegistrationMarketingPage
  }
`;

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
