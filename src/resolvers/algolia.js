import AlgoliaCampaignCollection from '../dataSources/collections/AlgoliaCampaignCollection';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    searchCampaigns: async (_, args, context, info) => {
      const results = await context.dataSources.algoliaAPI.searchCampaigns(
        args,
      );

      return new AlgoliaCampaignCollection(results, context, info);
    },
  },
};

export default resolvers;
