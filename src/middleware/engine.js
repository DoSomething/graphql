import { Engine } from 'apollo-engine';
import config from '../../config';

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
  const apiKey = config('engine.key');
  if (!apiKey) {
    return null;
  }

  // Create & configure Engine on first run.
  if (!engine) {
    engine = new Engine({
      engineConfig: { apiKey },
      graphqlPort: config('app.port'),
    });

    engine.start();
  }

  return engine;
};
