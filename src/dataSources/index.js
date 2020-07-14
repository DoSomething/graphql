import AlgoliaAPI from './AlgoliaAPI';

/**
 * Available data source classes for different services.
 */
const dataSources = () => ({
  algoliaAPI: new AlgoliaAPI(),
});

export default dataSources;
