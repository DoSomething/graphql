const resolvers = {
  Query: {
    searchCampaigns: async (_, __, context) =>
      context.dataSources.algoliaAPI.searchCampaigns(),

    // @FUTURE Example of other potential upcoming resolver.
    // searchPages: (_, __, context) =>
    //   context.dataSources.algoliaAPI.searchPages(),
  },
};

export default resolvers;
