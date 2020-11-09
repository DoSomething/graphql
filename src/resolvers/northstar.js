import { has } from 'lodash';
import { getFields } from 'fielddataloader';
import { DateResolver, DateTimeResolver, URLResolver } from 'graphql-scalars';

import Loader from '../loader';
import { stringToEnum, listToEnums } from './helpers';
import {
  updateCausePreferences,
  updateEmailSubscriptionTopics,
  updateEmailSubscriptionTopic,
  updateEmailSubscriptionStatus,
  getPermalinkByUserId,
  undoDeletionRequest,
  requestDeletion,
  updateClubId,
  updateSchoolId,
  getUsers,
} from '../repositories/northstar';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    user: (_, { id }, context, info) =>
      Loader(context).users.load(id, getFields(info)),
    users: (_, args, context, info) => getUsers(args, getFields(info), context),
  },

  Mutation: {
    requestDeletion: (_, args, context) => requestDeletion(args.id, context),
    undoDeletionRequest: (_, args, context) =>
      undoDeletionRequest(args.id, context),
    updateEmailSubscriptionStatus: (_, args, context) =>
      updateEmailSubscriptionStatus(
        args.id,
        args.emailSubscriptionStatus,
        context,
      ),
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
    updateCausePreferences: (_, args, context) =>
      updateCausePreferences(args.id, args.cause, args.interested, context),
    updateClubId: (_, args, context) =>
      updateClubId(args.id, args.clubId, context),
    updateSchoolId: (_, args, context) =>
      updateSchoolId(args.id, args.schoolId, context),
  },

  AbsoluteUrl: URLResolver,

  Date: DateResolver,

  DateTime: DateTimeResolver,

  User: {
    role: user => stringToEnum(user.role),
    smsStatus: user => stringToEnum(user.smsStatus),
    voterRegistrationStatus: user => stringToEnum(user.voterRegistrationStatus),
    emailSubscriptionTopics: user => listToEnums(user.emailSubscriptionTopics),
    permalink: user => getPermalinkByUserId(user.id),
    hasFeatureFlag: (user, { feature }) =>
      has(user, `featureFlags.${feature}`) &&
      user.featureFlags[feature] !== false,
    causes: user => listToEnums(user.causes),
  },
};

export default resolvers;
