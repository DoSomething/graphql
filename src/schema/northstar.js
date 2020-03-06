import { has } from 'lodash';
import { gql } from 'apollo-server';
import { getFields } from 'fielddataloader';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date';
import { makeExecutableSchema } from 'graphql-tools';

import Loader from '../loader';
import SensitiveFieldDirective from './directives/SensitiveFieldDirective';
import OptionalFieldDirective from './directives/OptionalFieldDirective';
import { stringToEnum, listToEnums } from './helpers';
import {
  updateEmailSubscriptionTopics,
  updateEmailSubscriptionTopic,
  getPermalinkByUserId,
  undoDeletionRequest,
  requestDeletion,
  updateSchoolId,
  getUsers,
} from '../repositories/northstar';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar Date

  scalar DateTime

  scalar AbsoluteUrl

  directive @requires(fields: String!) on FIELD_DEFINITION

  directive @optional on FIELD_DEFINITION

  directive @sensitive on FIELD_DEFINITION

  "The user's role defines their abilities on any DoSomething.org site."
  enum Role {
    USER
    STAFF
    ADMIN
  }

  "The user's SMS subscription status."
  enum SubscriptionStatus {
    "User is actively subscribed to messaging."
    ACTIVE
    "User has requested to receive fewer broadcasts."
    LESS
    "User has texted STOP to unsubscribe from messaging."
    STOP
    "The mobile number is invalid, cannot receive texts, or texted STOP in the past."
    UNDELIVERABLE
    "An unknown issue exists with this user's SMS subscription."
    UNKNOWN
    "User has received an askSubscriptionStatus broadcast but never answered with valid preference."
    PENDING
  }

  enum VoterRegistrationStatus {
    REGISTRATION_COMPLETE
    CONFIRMED
    INELIGIBLE
    UNCERTAIN
    UNREGISTERED
  }

  enum EmailSubscriptionTopic {
    NEWS
    COMMUNITY
    SCHOLARSHIPS
    LIFESTYLE
  }

  "A DoSomething.org user profile."
  type User {
    "The user's Northstar ID."
    id: String!
    "The user's display name is their first name and (if set) last initial."
    displayName: String
    "The user's first name."
    firstName: String
    "The user's last name."
    lastName: String @sensitive @optional
    "The user's last initial."
    lastInitial: String
    "The user's email address."
    email: String @sensitive @optional
    "A preview of the user's email address."
    emailPreview: String
    "The user's mobile number."
    mobile: String @sensitive @optional
    "A preview of the user's mobile number."
    mobilePreview: String
    "The user's age."
    age: Int
    "The user's birthdate, formatted YYYY-MM-DD."
    birthdate: Date @sensitive @optional
    "The user's street address. Null if unauthorized."
    addrStreet1: String @sensitive @optional
    "The user's extended street address (for example, apartment number). Null if unauthorized."
    addrStreet2: String @sensitive @optional
    "The user's city. Null if unauthorized."
    addrCity: String
    "The user's state. Null if unauthorized."
    addrState: String
    "The user's 6-digit zip code. Null if unauthorized."
    addrZip: String
    "The user's registration source. This is often a Northstar OAuth client."
    source: String
    "More information about the user's registration source (for example, a campaign or broadcast ID)."
    sourceDetail: String
    "The user's email subscription status."
    emailSubscriptionStatus: Boolean
    "The user's email subscription status."
    emailSubscriptionTopics: [EmailSubscriptionTopic]!
    "The user's SMS status."
    smsStatus: SubscriptionStatus
    "The user's conversation status will be paused if they are in a support conversation."
    smsPaused: Boolean
    "The user's language, as reported by their browser when they registered."
    language: String
    "The user's ISO-3166  country code."
    country: String
    "The user's role."
    role: Role
    "The user's current School ID"
    schoolId: String @sensitive @optional
    "The user's voter registration status, either self-reported or by registering with TurboVote."
    voterRegistrationStatus: VoterRegistrationStatus
    "If the user has requested their account to be deleted, this is the time that request occurred."
    deletionRequestedAt: DateTime
    "The time this user was created. See the 'source' and 'source_detail' field for details."
    createdAt: DateTime
    "The last modified time for this user account."
    updatedAt: DateTime
    "The last time this user visited DoSomething.org on the web (accurate within an hour)."
    lastAccessedAt: DateTime
    "The last time this user logged-in to DoSomething.org with their username & password."
    lastAuthenticatedAt: DateTime
    "The last time this user messaged DoSomething.org via Gambit."
    lastMessagedAt: DateTime
    "Whether user plans to vote in upcoming election (e.g. 'voting', 'voted', 'not_sure')"
    votingPlanStatus: String
    "Who user plans to attend polls with to vote in upcoming election."
    votingPlanAttendingWith: String
    "How user plans to get to the polls to vote in upcoming election."
    votingPlanMethodOfTransport: String
    "What time of day user plans to get the polls to vote in upcoming election."
    votingPlanTimeOfDay: String
    "Whether or not the user is opted-in to the given feature."
    hasFeatureFlag(feature: String): Boolean @requires(fields: "featureFlags")
    "The permalink to this user's profile in Aurora."
    permalink: String @requires(fields: "id")
  }

  type Query {
    "Get a user by ID."
    user(id: String!): User
    users(search: String!): [User]
  }

  type Mutation {
    "Request deletion for the given user account."
    requestDeletion("The user ID to request deletion for." id: String!): User!
    "Request deletion for the given user account."
    undoDeletionRequest(
      "The user ID whose request we're undoing."
      id: String!
    ): User!
    "Update the list of newsletters a user is subscribed to."
    updateEmailSubscriptionTopics(
      "The user to update."
      id: String!
      "The newsletters the user should be subscribed to."
      emailSubscriptionTopics: [EmailSubscriptionTopic]!
    ): User!
    "Update the user's subscription for a given newsletter."
    updateEmailSubscriptionTopic(
      "The user to update."
      id: String!
      "The newsletter the to update the subscription status of."
      topic: EmailSubscriptionTopic!
      "The new subscription status."
      subscribed: Boolean!
    ): User!
    "Update the user school id."
    updateSchoolId(
      "The user to update."
      id: String!
      "The school_id to save to the user."
      schoolId: String
    ): User!
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  User: {
    role: user => stringToEnum(user.role),
    smsStatus: user => stringToEnum(user.smsStatus),
    voterRegistrationStatus: user => stringToEnum(user.voterRegistrationStatus),
    emailSubscriptionTopics: user => listToEnums(user.emailSubscriptionTopics),
    permalink: user => getPermalinkByUserId(user.id),
    hasFeatureFlag: (user, { feature }) =>
      has(user, `featureFlags.${feature}`) &&
      user.featureFlags[feature] !== false,
  },
  Query: {
    user: (_, { id }, context, info) =>
      Loader(context).users.load(id, getFields(info)),
    users: (_, args, context, info) => getUsers(args, getFields(info), context),
  },
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Mutation: {
    requestDeletion: (_, args, context) => requestDeletion(args.id, context),
    undoDeletionRequest: (_, args, context) =>
      undoDeletionRequest(args.id, context),
    updateEmailSubscriptionTopics: (_, args, context) =>
      updateEmailSubscriptionTopics(
        args.id,
        args.emailSubscriptionTopics,
        context,
      ),
    updateEmailSubscriptionTopic: (_, args, context) =>
      updateEmailSubscriptionTopic(
        args.id,
        args.topic,
        args.subscribed,
        context,
      ),
    updateSchoolId: (_, args, context) =>
      updateSchoolId(args.id, args.schoolId, context),
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
    sensitive: SensitiveFieldDirective,
    optional: OptionalFieldDirective,
  },
});
