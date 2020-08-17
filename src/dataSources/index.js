import Algolia from './Algolia';

/**
 * Available data source classes for different services.
 */
const dataSources = () => ({
  algolia: new Algolia(),
});

export default dataSources;
