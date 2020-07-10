import Loader from '../loader';
import AlgoliaCampaignCollection from '../dataSources/collections/AlgoliaCampaignCollection';

const resolvers = {
  Query: {
    searchCampaigns: async (_, args, context, info) => {
      const results = await context.dataSources.algoliaAPI.searchCampaigns(
        args,
      );

      return new AlgoliaCampaignCollection(results, context, info);
    },

    // @FUTURE Example of other potential upcoming resolver.
    // searchPages: (_, __, context) =>
    //   context.dataSources.algoliaAPI.searchPages(),
  },

  CampaignSearchEdge: {
    node: (edge, args, context) => Loader(context).campaigns.load(edge._id),
  },
};

export default resolvers;
