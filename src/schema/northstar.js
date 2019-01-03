import { makeExecutableSchema } from 'graphql-tools';
import gql from 'tagged-template-noop';
import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLAbsoluteUrl } from 'graphql-url';

import Loader from '../loader';
import { stringToEnum } from './helpers';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar Date

  scalar DateTime

  scalar AbsoluteUrl

  # The user's role defines their abilities on any DoSomething.org site.
  enum Role {
    USER
    STAFF
    ADMIN
  }

  # The user's SMS subscription status.
  enum SubscriptionStatus {
    # User is actively subscribed to messaging.
    ACTIVE
    # User has requested to receive fewer broadcasts.
    LESS
    # User has texted STOP to unsubscribe from messaging.
    STOP
    # The mobile number is invalid, cannot receive texts, or texted STOP in the past.
    UNDELIVERABLE
    # An unknown issue exists with this user's SMS subscription.
    UNKNOWN
  }

  enum VoterRegistrationStatus {
    REGISTRATION_COMPLETE
    CONFIRMED
    INELIGIBLE
    UNCERTAIN
  }

  # A DoSomething.org user profile.
  type User {
    # The user's Northstar ID.
    id: String!
    # The user's first name.
    firstName: String
    # The user's last name. Null if unauthorized.
    lastName: String
    # The user's last initial.
    lastInitial: String
    # The user's email address.
    email: String
    # The user's mobile number.
    mobile: String
    # The user's birthdate, formatted YYYY-MM-DD.
    birthdate: Date
    # The user's street address. Null if unauthorized.
    addrStreet1: String
    # The user's extended street address (for example, apartment number). Null if unauthorized.
    addrStreet2: String
    # The user's city. Null if unauthorized.
    addrCity: String
    # The user's state. Null if unauthorized.
    addrState: String
    # The user's 6-digit zip code. Null if unauthorized.
    addrZip: String
    # The user's registration source. This is often a Northstar OAuth client.
    source: String
    # More information about the user's registration source (for example, a campaign or broadcast ID).
    sourceDetail: String
    # The user's SMS status.
    smsStatus: SubscriptionStatus
    # The user's conversation status will be paused if they are in a support conversation.
    smsPaused: Boolean
    # The user's language, as reported by their browser when they registered.
    language: String
    # The user's ISO-3166  country code.
    country: String
    # The user's role.
    role: Role
    # The user's voter registration status, either self-reported or by registering with TurboVote.
    voterRegistrationStatus: VoterRegistrationStatus
    # The time this user was created. See the 'source' and 'source_detail' field for details.
    createdAt: DateTime
    # The last modified time for this user account.
    updatedAt: DateTime
    # The last time this user visited DoSomething.org on the web (accurate within an hour).
    lastAccessedAt: DateTime
    # The last time this user logged-in to DoSomething.org with their username & password.
    lastAuthenticatedAt: DateTime
    # The last time this user messaged DoSomething.org via Gambit.
    lastMessagedAt: DateTime
  }

  type Query {
    # Get a user by ID.
    user(id: String!): User
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
  },
  Query: {
    user: (_, args, context) => Loader(context).users.load(args.id),
  },
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  AbsoluteUrl: GraphQLAbsoluteUrl,
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
