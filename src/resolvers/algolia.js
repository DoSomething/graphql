import { map } from 'lodash';
import { algolia } from '../algolia';

const resolvers = {
  Query: {
    searchCampaigns: async () => {
      const allCampaigns = await algolia('local_campaigns').search('');

      console.log(allCampaigns);

      return map(allCampaigns.hits, 'id');
    },
  },
};

export default resolvers;
