import { map } from 'lodash';

import AlgoliaCollection from '../dataSources/AlgoliaCollection';

const resolvers = {
  Query: {
    searchCampaigns: async (_, args, context, info) => {
      const results = await context.dataSources.algoliaAPI.searchCampaigns(
        args,
      );

      // return new AlgoliaCollection(results, context, info);

      // Temp
      return {
        results: map(results.hits, 'id'),
      };
    },

    // @FUTURE Example of other potential upcoming resolver.
    // searchPages: (_, __, context) =>
    //   context.dataSources.algoliaAPI.searchPages(),
  },
};

export default resolvers;
