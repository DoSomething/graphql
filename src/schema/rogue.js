import { gql } from 'apollo-server';
import GraphQLJSON from 'graphql-type-json';
import { getFields } from 'fielddataloader';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import { GraphQLDateTime } from 'graphql-iso-date';
import { makeExecutableSchema } from 'graphql-tools';

import Loader from '../loader';
import OptionalFieldDirective from './directives/OptionalFieldDirective';
import { urlWithQuery, transformItem } from '../repositories/helpers';
import {
  getActionById,
  getActionStats,
  getCampaigns,
  getGroupById,
  getGroups,
  getGroupTypeById,
  getGroupTypes,
  getPaginatedCampaigns,
  getPaginatedGroups,
  getPermalinkBySignupId,
  getPermalinkByPostId,
  getPosts,
  getPaginatedPosts,
  getPostsByUserId,
  getPostsByCampaignId,
  getPostsBySignupId,
  getPostById,
  getSignups,
  getPaginatedSignups,
  getSignupsByUserId,
  getSignupsCount,
  getVoterRegistrationsCountByGroupId,
  getVoterRegistrationsCountByReferrerUserId,
  toggleReaction,
  getPostsCount,
  makeImpactStatement,
  parseCampaignCauses,
  updatePostQuantity,
  reviewPost,
  tagPost,
  rotatePost,
  deletePost,
  createSignup,
  deleteSignup,
} from '../repositories/rogue';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar JSON

  scalar DateTime

  scalar AbsoluteUrl

  directive @requires(fields: String!) on FIELD_DEFINITION

  directive @optional on FIELD_DEFINITION

  "Posts are reviewed by DoSomething.org staff for content."
  enum ReviewStatus {
    ACCEPTED
    CONFIRMED
    INELIGIBLE
    PENDING
    REGISTER_FORM
    REGISTER_OVR
    REJECTED
    STEP_1
    STEP_2
    STEP_3
    STEP_4
    UNCERTAIN
    UNDER_18
  }

  enum LocationFormat {
    "Machine-readable ISO-3166-2 format (e.g. US-NY)"
    ISO_FORMAT
    "Human-readable location name."
    HUMAN_FORMAT
  }

  "A cause space."
  type Cause {
    id: String!
    name: String!
  }

  "A campaign."
  type Campaign {
    "The time when this campaign was originally created."
    createdAt: DateTime
    "The time when this campaign ends."
    endDate: DateTime
    "The unique ID for this campaign."
    id: Int!
    "The Contentful campaign ID where this campaign is being used."
    contentfulCampaignId: String
    "The internal name used to identify the campaign."
    internalTitle: String!
    "Collection of Actions associated to the Campaign."
    actions: [Action]
    "The cause-spaces for this campaign."
    causes: [Cause] @requires(fields: "cause causeNames")
    "The internal documentation used for campaign proof of impact."
    impactDoc: String
    "Is this campaign open?"
    isOpen: Boolean!
    "The number of posts pending review. Only visible by staff/admins."
    pendingCount: Int
    "The number of accepted posts."
    acceptedCount: Int
    "The time when this campaign starts."
    startDate: DateTime
    "The time when this campaign last modified."
    updatedAt: DateTime
    "The user activity group type ID associated with this campaign."
    groupTypeId: Int
    "The user activity group type associated with this campaign."
    groupType: GroupType
  }

  "A paginated list of campaigns. This is a 'Connection' in Relay's parlance, and follows the [Relay Cursor Connections](https://dfurn.es/338oQ6i) specification."
  type CampaignCollection {
    edges: [CampaignEdge]
    pageInfo: PageInfo!
  }

  "Campaign in a paginated list."
  type CampaignEdge {
    cursor: String!
    node: Campaign!
  }

  "Information about a paginated list."
  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type Action {
    "The unique ID for this action."
    id: Int!
    "The internal name for this action."
    name: String
    "The readable name of this action's type."
    actionLabel: String
    "The machine name of this action's type."
    actionType: String
    "Does this action count as a reportback?"
    reportback: Boolean
    "Callpower Campaign ID this action belongs to"
    callpowerCampaignId: Int
    "Campaign ID this action belongs to"
    campaignId: Int!
    "Campaign this action belongs to"
    campaign: Campaign
    "Does this action count as a civic action?"
    civicAction: Boolean
    "Is this an online action?"
    online: Boolean
    "The readable name of post type this action should create."
    postLabel: String
    "The machine name of the post type this action should create."
    postType: String
    "Is this action a quiz?"
    quiz: Boolean
    "Does this action count as a scholarship entry?"
    scholarshipEntry: Boolean
    "Does this action qualify for volunteer credit?"
    volunteerCredit: Boolean
    "Does this action associate user posts with their school?"
    collectSchoolId: Boolean
    "Anonymous actions will not be attributed to a particular user in public galleries."
    anonymous: Boolean
    "The noun for this action, e.g. 'cards' or 'jeans'."
    noun: String
    "The verb for this action, e.g. 'donated' or 'created'."
    verb: String
    "The time when this action was originally created."
    createdAt: DateTime
    "The time when this action was last modified."
    updatedAt: DateTime
    "How long will this action take to complete?"
    timeCommitmentLabel: String
    "Aggregate post information for this action by school."
    schoolActionStats(
      "The school ID to display an action stat for."
      schoolId: String
      "How to order the results (e.g. 'accepted_quantity,desc')."
      orderBy: String = "accepted_quantity,desc"
    ): [SchoolActionStat]
  }

  "A user activity group."
  type Group {
    "The unique ID for this group."
    id: Int!
    "The group type ID this group belongs to."
    groupTypeId: Int!
    "The group type this group belongs to."
    groupType: GroupType
    "The group name."
    name: String!
    "The group school ID."
    schoolId: String
    "The group goal."
    goal: Int
    "The group city."
    city: String
    "The group state."
    state: String
    "The time this group was last modified."
    updatedAt: DateTime
    "The time when this group was originally created."
    createdAt: DateTime
  }

  "A paginated list of user activity groups. This is a 'Connection' in Relay's parlance, and follows the [Relay Cursor Connections](https://dfurn.es/338oQ6i) specification."
  type GroupCollection {
    edges: [GroupEdge]
    pageInfo: PageInfo!
  }

  "User activity group in a paginated list."
  type GroupEdge {
    cursor: String!
    node: Group!
  }

  "A type of user activity group."
  type GroupType {
    "The unique ID for this group type."
    id: Int!
    "The name of the group type."
    name: String!
    "Whether group finders for this type should first filter by state before searching by name."
    filterByState: Boolean
    "The time this group type was last modified."
    updatedAt: DateTime
    "The time when this group type was originally created."
    createdAt: DateTime
  }

  "A media resource on a post."
  type Media {
    "The image URL."
    url(
      "The desired image width, in pixels."
      w: Int
      "The desired image height, in pixels."
      h: Int
    ): AbsoluteUrl
    "The text content of the post, provided by the user."
    text: String
  }

  "A user's post on a campaign."
  type Post {
    "The unique ID for this post."
    id: Int!
    "The type of action (e.g. 'photo', 'voterReg', or 'text')."
    type: String!
    "The specific action being performed (or 'default' on a single-action campaign)."
    action: String!
      @deprecated(reason: "Use 'actionDetails' relationship instead.")
    "The specific action being performed."
    actionDetails: Action
    "The Northstar user ID of the user who created this post."
    userId: String
    "The Rogue campaign ID this post was made for."
    campaignId: String
    "The Rogue campaign this post was made for."
    campaign: Campaign
    "The location this post was submitted from. This is provided by Fastly geo-location headers on the web."
    location(format: LocationFormat = ISO_FORMAT): String
    "The attached media for this post."
    media: Media
      @deprecated(reason: "Use direct 'url' and 'text' properties instead.")
    "The image URL."
    url(
      "The desired image width, in pixels."
      w: Int
      "The desired image height, in pixels."
      h: Int
    ): AbsoluteUrl
    "The text content of the post, provided by the user."
    text: String
    "The ID of the associated signup for this post."
    signupId: String!
    "The associated signup for this post."
    signup: Signup
    "The review status of the post."
    status: ReviewStatus
    "The source of this post. This is often a Northstar OAuth client."
    source: String
    "Extra information about this post."
    details: String
    "The user who referred the post user to create this post."
    referrerUserId: String
    "The associated user activity group ID for this post."
    groupId: Int
    "The associated user activity group for this post."
    group: Group
    "The number of items added or removed in this post."
    quantity: Int
    "The human-readable impact (quantity, noun, and verb)."
    impact: String
    "The tags that have been applied to this post by DoSomething.org staffers."
    tags: [String]
    "The total number of reactions to this post."
    reactions: Int
    "Has the current user reacted to this post?"
    reacted: Boolean
    "The ID of the associated school for this post."
    schoolId: String
    "The IP address this post was created from."
    remoteAddr: String @deprecated(reason: "This field is no longer stored.")
    "The time this post was last modified."
    updatedAt: DateTime
    "The time when this post was originally created."
    createdAt: DateTime
    "Permalink to Admin view."
    permalink: String
    "This flag is set when a post has been deleted. On subsequent queries, this post will be null."
    deleted: Boolean
  }

  "Experimental: A paginated list of posts. This is a 'Connection' in Relay's parlance, and follows the [Relay Cursor Connections](https://dfurn.es/338oQ6i) specification."
  type PostCollection {
    edges: [PostEdge]
    pageInfo: PageInfo!
  }

  "Experimental: Post in a paginated list."
  type PostEdge {
    cursor: String!
    node: Post!
  }

  "A user's signup for a campaign."
  type Signup {
    "The unique ID for this signup."
    id: Int!
    "The associated posts made under this signup."
    posts: [Post]
    "The associated campaign for this signup."
    campaign: Campaign
    "The Rogue campaign ID this post was made for."
    campaignId: String
    "The Drupal campaign run ID this signup was made for."
    campaignRunId: String
      @deprecated(reason: "We no longer stored campaign run IDs.")
    "The Northstar ID of the user who created this signup."
    userId: String
    "The total number of items on all posts attached to this signup."
    quantity: Int
    "The user's self-reported reason for doing this campaign."
    whyParticipated: String
    "The source application of this signup (e.g. sms, phoenix-next)"
    source: String
    "Additional source details (e.g. page or broadcast ID)"
    sourceDetails: String
    "More information about the signup (for example, third-party messaging opt-ins)."
    details: String
    "The user who referred the signup user to create this signup."
    referrerUserId: String
    "The associated user activity group ID for this signup."
    groupId: Int
    "The associated user activity group for this signup."
    group: Group
    "The time this signup was last modified."
    updatedAt: DateTime
    "The time when this signup was originally created."
    createdAt: DateTime
    "Permalink to Admin view."
    permalink: String
    "This flag is set when a signup has been deleted. On subsequent queries, this signup will be null."
    deleted: Boolean
  }

  "A paginated list of signups. This is a 'Connection' in Relay's parlance, and follows the [Relay Cursor Connections](https://dfurn.es/338oQ6i) specification."
  type SignupCollection {
    edges: [SignupEdge]
    pageInfo: PageInfo!
  }

  "Signup in a paginated list."
  type SignupEdge {
    cursor: String!
    node: Signup!
  }

  "A set of aggregate post information for a school and action."
  type SchoolActionStat {
    "The unique ID for this school action stat."
    id: Int!
    "The school ID this stat belongs to"
    schoolId: String!
    "The action ID this stat belongs to."
    actionId: Int!
    "The action this stat belongs to."
    action: Action!
    "The aggregate impact of the school for the action."
    impact: Int!
    "The sum quantity of all accepted posts with school and action."
    acceptedQuantity: Int!
      @deprecated(reason: "Use 'impact' field instead.")
    "The time the stat was created."
    createdAt: DateTime
    "The time the stat was updated."
    updatedAt: DateTime
  }

  type Query {
    "Get an Action by ID."
    action(id: Int!): Action
    "Get collection of Actions by Campaign ID."
    actions(campaignId: Int!): [Action]
    "Get a campaign by ID."
    campaign(id: Int!): Campaign
    "Get a list of campaigns."
    campaigns(
      "The internal title to load campaigns for."
      internalTitle: String
      "The page of results to return."
      page: Int = 1
      "Only return campaigns that are open or closed."
      isOpen: Boolean
      "Only return campaigns containing these causes."
      causes: [String]
      "Only return campaigns containing this group type id."
      groupTypeId: Int
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
      "The number of results per page."
      count: Int = 20
    ): [Campaign]
    "Get a Relay-style paginated collection of campaigns."
    paginatedCampaigns(
      "Get the first N results."
      first: Int = 20
      "The cursor to return results after."
      after: String
      "Only return campaigns that are open or closed."
      isOpen: Boolean
      "Only return campaigns containing these causes."
      causes: [String]
      "Only return campaigns containing this group type id."
      groupTypeId: Int
      "Only return campaigns that have a contentful campaign associated."
      hasWebsite: Boolean
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): CampaignCollection
    "Get a group by ID."
    group(id: Int!): Group
    "Get a list of groups."
    groups(
      "The group type ID to filter groups by."
      groupTypeId: Int
      "The group name to filter groups by."
      name: String
      "The group state to filter groups by."
      state: String
      "The group school ID to filter groups by."
      schoolId: String
    ): [Group]
    "Get a Relay-style paginated collection of groups."
    paginatedGroups(
      "Get the first N results."
      first: Int = 20
      "The cursor to return results after."
      after: String
      "The group type ID to filter groups by."
      groupTypeId: Int
      "The group name to filter groups by."
      name: String
      "The group state to filter groups by."
      state: String
      "The group school ID to filter groups by."
      schoolId: String
    ): GroupCollection
    "Get a group type by ID."
    groupType(id: Int!): GroupType
    "Get a list of group types."
    groupTypes: [GroupType]
    "Get a post by ID."
    post("The desired post ID." id: Int!): Post
    "Get a list of posts."
    posts(
      "The action name to load posts for."
      action: String
      "The action IDs to load posts for."
      actionIds: [Int]
      "The campaign ID to load posts for."
      campaignId: String
      "The signup ID to load posts for."
      signupId: String
      "The location to load posts for."
      location: String
      "The referring User ID to load posts for."
      referrerUserId: String
      "The user activity group ID to load posts for."
      groupId: Int
      "The post statuses to load posts for."
      status: [ReviewStatus]
      "The post source to load posts for."
      source: String
      "The tags to load posts for."
      tags: [String]
      "The type name to load posts for."
      type: String
      "The user ID to load posts for."
      userId: String
      "Filter by the corresponding Action's volunteer credit status"
      volunteerCredit: Boolean
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Post]
    "Get a paginated collection of posts."
    paginatedPosts(
      "The action name to load posts for."
      action: String
      "The action IDs to load posts for."
      actionIds: [Int]
      "The campaign ID to load posts for."
      campaignId: String
      "The signup ID to load posts for."
      signupId: String
      "The location to load posts for."
      location: String
      "The referring User ID to load posts for."
      referrerUserId: String
      "The user activity group ID to load posts for."
      groupId: Int
      "The post statuses to load posts for."
      status: [ReviewStatus]
      "The post source to load posts for."
      source: String
      "The tags to load posts for."
      tags: [String]
      "The type name to load posts for."
      type: String
      "The user ID to load posts for."
      userId: String
      "Filter by the corresponding Action's volunteer credit status"
      volunteerCredit: Boolean
      "Get the first N results."
      first: Int = 20
      "The cursor to return results after."
      after: String
    ): PostCollection
    " Get a paginated collection of posts by campaign ID."
    postsByCampaignId(
      "The campaign ID to load."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Post]
    "Get a paginated collection of posts by user ID."
    postsByUserId(
      "The Northstar user ID to filter posts by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
    ): [Post]
    schoolActionStats(
      "The School ID to filter school action stats by."
      schoolId: String
      "The Action ID to filter school action stats by."
      actionId: Int
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [SchoolActionStat]
    "Get a signup by ID."
    signup(id: Int!): Signup
    "Get a list of signups."
    signups(
      "The Campaign ID load signups for."
      campaignId: String
      "The Group ID to load signups for."
      groupId: Int
      "The referring User ID to load signups for."
      referrerUserId: String
      "The signup source to load signups for."
      source: String
      "The user ID to load signups for."
      userId: String
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [Signup]
    "Get a paginated collection of signups."
    paginatedSignups(
      "The Campaign ID load signups for."
      campaignId: String
      "The Group ID to load signups for."
      groupId: Int
      "The referring User ID to load signups for."
      referrerUserId: String
      "The signup source to load signups for."
      source: String
      "The user ID to load signups for."
      userId: String
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
      "Get the first N results."
      first: Int = 20
      "The cursor to return results after."
      after: String
    ): SignupCollection
    "Get a paginated collection of signups by user ID."
    signupsByUserId(
      "The Northstar user ID to filter signups by."
      id: String!
      "The page of results to return."
      page: Int = 1
      "The number of results per page."
      count: Int = 20
      "How to order the results (e.g. 'id,desc')."
      orderBy: String = "id,desc"
    ): [Signup]
    "Find out how many signups a particular user has. Intended for use with badges."
    signupsCount(
      "The Campaign ID to count signups for."
      campaignId: String
      "The signup source to count signups for."
      source: String
      "The user ID to count signups for."
      userId: String
      "# The maximum count to report."
      limit: Int = 20
    ): Int
    "Get post counts."
    postsCount(
      "The action name to count posts for."
      action: String
      "The action IDs to count posts for."
      actionIds: [Int]
      "The campaign ID to count posts for."
      campaignId: String
      "The location to count posts for."
      location: String
      "The referring User ID to count posts for."
      referrerUserId: String
      "The post source to count posts for."
      source: String
      "The post statuses to count posts for."
      status: [ReviewStatus]
      "The type name to count posts for."
      type: String
      "The user ID to count posts for."
      userId: String
      "A comma-separated list of tags to filter by."
      tags: String
      "The maximum count to report."
      limit: Int = 20
    ): Int
    "Find out how many completed voter registrations a group has."
    voterRegistrationsCountByGroupId(
      "The Group ID to count completed voter registrations for."
      groupId: Int!
    ): Int
    "Find out how many completed voter registrations a referring user has."
    voterRegistrationsCountByReferrerUserId(
      "The Referrer User ID to count completed voter registrations for."
      referrerUserId: String!
    ): Int
  }

  type Mutation {
    "Add or remove a reaction to a post. Requires an access token."
    toggleReaction("The post ID to react to." postId: Int!): Post
    "Update quantity on a post. Requires staff/admin role."
    updatePostQuantity(
      "The post ID to update."
      id: Int!
      "The new quantity."
      quantity: Int!
    ): Post
    "Review a post. Requires staff/admin role."
    reviewPost(
      "The post ID to review."
      id: Int!
      "The status to give this post."
      status: ReviewStatus!
    ): Post
    "Add or remove a tag on a post. Requires staff/admin role."
    tagPost(
      "The post ID to review."
      id: Int!
      "The tag to add or remove on this post."
      tag: String!
    ): Post
    "Rotate a post's image. Requires staff/admin role."
    rotatePost(
      "The post ID to rotate."
      id: Int!
      "The number of degrees to rotate (clockwise)."
      degrees: Int! = 90
    ): Post
    "Delete a post. Requires staff/admin role."
    deletePost("The post ID to delete." id: Int!): Post
    "Create a signup."
    createSignup(campaignId: Int!, detail: JSON): Signup
    "Delete a signup. Requires staff/admin role."
    deleteSignup("The signup ID to delete." id: Int!): Signup
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  JSON: GraphQLJSON,
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Action: {
    campaign: (action, args, context, info) =>
      Loader(context).campaigns.load(action.campaignId, getFields(info)),
    schoolActionStats: (action, args, context) =>
      getActionStats(args.schoolId, action.id, args.orderBy, context),
  },
  Group: {
    groupType: (group, args, context, info) =>
      Loader(context).groupTypes.load(group.groupTypeId, getFields(info)),
  },
  Media: {
    url: (media, args) => urlWithQuery(media.url, args),
  },
  Post: {
    campaign: (post, args, context, info) =>
      Loader(context).campaigns.load(post.campaignId, getFields(info)),
    group: (post, args, context, info) =>
      post.groupId
        ? Loader(context).groups.load(post.groupId, getFields(info))
        : null,
    signup: (post, args, context) =>
      Loader(context).signups.load(post.signupId),
    url: (post, args) => urlWithQuery(post.media.url, args),
    text: post => post.media.text,
    status: post => post.status.toUpperCase().replace('-', '_'),
    actionDetails: post => transformItem(post.actionDetails),
    location: (post, { format }) => {
      switch (format) {
        case 'HUMAN_FORMAT':
          return post.locationName;
        case 'ISO_FORMAT':
          return post.location;
        default:
          return null;
      }
    },
    impact: post => makeImpactStatement(post),
    reacted: post => post.reactions.reacted,
    reactions: post => post.reactions.total,
    permalink: post => getPermalinkByPostId(post.id),
  },
  SchoolActionStat: {
    acceptedQuantity: actionStat => actionStat.impact,
    action: (schoolActionStat, args, context, info) =>
      Loader(context).actions.load(schoolActionStat.actionId, getFields(info)),
  },
  Signup: {
    campaign: (signup, args, context, info) =>
      Loader(context).campaigns.load(signup.campaignId, getFields(info)),
    group: (signup, args, context, info) =>
      signup.groupId
        ? Loader(context).groups.load(signup.groupId, getFields(info))
        : null,
    permalink: signup => getPermalinkBySignupId(signup.id),
    posts: (signup, args, context) => getPostsBySignupId(signup.id, context),
  },
  Query: {
    action: (_, args, context) => getActionById(args.id, context),
    actions: (_, args, context) =>
      Loader(context).actionsByCampaignId.load(args.campaignId),
    campaign: (_, args, context) => Loader(context).campaigns.load(args.id),
    campaigns: (_, args, context) => getCampaigns(args, context),
    group: (_, args, context) => getGroupById(args.id, context),
    groups: (_, args, context) => getGroups(args, context),
    groupType: (_, args, context) => getGroupTypeById(args.id, context),
    groupTypes: (_, args, context) => getGroupTypes(args, context),
    paginatedCampaigns: (_, args, context) =>
      getPaginatedCampaigns(args, context),
    paginatedGroups: (_, args, context) => getPaginatedGroups(args, context),
    paginatedPosts: (_, args, context) => getPaginatedPosts(args, context),
    post: (_, args, context) => getPostById(args.id, context),
    posts: (_, args, context) => getPosts(args, context),
    postsByCampaignId: (_, args, context) =>
      getPostsByCampaignId(args.id, args.page, args.count, context),
    postsByUserId: (_, args, context) =>
      getPostsByUserId(args.id, args.page, args.count, context),
    schoolActionStats: (_, args, context) =>
      getActionStats(args.schoolId, args.actionId, args.orderBy, context),
    signup: (_, args, context) => Loader(context).signups.load(args.id),
    signups: (_, args, context) => getSignups(args, context),
    paginatedSignups: (_, args, context) => getPaginatedSignups(args, context),
    signupsByUserId: (_, args, context) => getSignupsByUserId(args, context),
    signupsCount: (_, args, context) => getSignupsCount(args, context),
    postsCount: (_, args, context) => getPostsCount(args, context),
    voterRegistrationsCountByGroupId: (_, args, context) =>
      getVoterRegistrationsCountByGroupId(args.groupId, context),
    voterRegistrationsCountByReferrerUserId: (_, args, context) =>
      getVoterRegistrationsCountByReferrerUserId(args.referrerUserId, context),
  },
  Mutation: {
    toggleReaction: (_, args, context) => toggleReaction(args.postId, context),
    updatePostQuantity: (_, args, context) =>
      updatePostQuantity(args.id, args.quantity, context),
    reviewPost: (_, args, context) => reviewPost(args.id, args.status, context),
    tagPost: (_, args, context) => tagPost(args.id, args.tag, context),
    rotatePost: (_, args, context) =>
      rotatePost(args.id, args.degrees, context),
    deletePost: (_, args, context) => deletePost(args.id, context),
    createSignup: (_, args, context) => createSignup(args, context),
    deleteSignup: (_, args, context) => deleteSignup(args.id, context),
  },
  Campaign: {
    actions: (campaign, args, context) =>
      Loader(context).actionsByCampaignId.load(campaign.id),
    causes: campaign => parseCampaignCauses(campaign),
    groupType: (campaign, args, context, info) =>
      campaign.groupTypeId
        ? Loader(context).groupTypes.load(campaign.groupTypeId, getFields(info))
        : null,
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
  schemaDirectives: {
    optional: OptionalFieldDirective,
  },
});
