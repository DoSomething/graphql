import { getVotingInformationByLocation } from '../repositories/airtable';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    locationVotingInformation: (_, args) =>
      getVotingInformationByLocation(args.location),
  },
};

export default resolvers;
