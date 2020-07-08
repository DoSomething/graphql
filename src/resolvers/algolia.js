import { map } from 'lodash';

import Loader from '../loader';
import AlgoliaCollection from '../dataSources/AlgoliaCollection';

const resolvers = {
  Query: {
    searchCampaigns: async (_, args, context, info) => {
      const results = await context.dataSources.algoliaAPI.searchCampaigns(
        args,
      );

      const collection = new AlgoliaCollection(results, context, info);

      const edges = collection.edges;
      const pageInfo = collection.pageInfo;

      // console.log(collection);
      console.log({ edges, pageInfo });

      // Temp
      return {
        results: map(results.hits, 'id'),
      };
    },

    // @FUTURE Example of other potential upcoming resolver.
    // searchPages: (_, __, context) =>
    //   context.dataSources.algoliaAPI.searchPages(),
  },

  SearchEdge: {
    node: (edge, args, context) => {
      console.log('👋', edge);

      return Loader(context).campaigns.load(edge._id);
    },
  },
};

export default resolvers;
