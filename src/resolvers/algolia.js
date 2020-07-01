import AlgoliaCollection from '../dataSources/AlgoliaCollection';

const resolvers = {
  Query: {
    searchCampaigns: async (_, args, context, info) => {
      const { cursor, isOpen = true, perPage = 20, term = '' } = args;

      const results = await context.dataSources.algoliaAPI.searchCampaigns(
        term,
        {},
      );

      // return new AlgoliaCollection(results, context, info);

      // Temp
      return {
        results,
      };
    },

    // @FUTURE Example of other potential upcoming resolver.
    // searchPages: (_, __, context) =>
    //   context.dataSources.algoliaAPI.searchPages(),
  },
};

export default resolvers;
