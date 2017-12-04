import { Engine } from 'apollo-engine';

const { APOLLO_ENGINE_API_KEY } = process.env;

/**
 * The Engine singleton.
 *
 * @type {Engine}
 */
let engine;

/**
 * Configure the Apollo Engine proxy.
 *
 * @return {Engine}
 */
export default () => {
  if (!APOLLO_ENGINE_API_KEY) {
    return null;
  }

  // Create & configure Engine on first run.
  if (!engine) {
    engine = new Engine({
      engineConfig: { apiKey: APOLLO_ENGINE_API_KEY },
      graphqlPort: process.env.PORT || 3000,
    });

    engine.start();
  }

  return engine;
};
