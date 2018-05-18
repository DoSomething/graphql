import path from 'path';
import cors from 'cors';
import { URL } from 'url';
import helmet from 'helmet';
import handlebars from 'hbs';
import express from 'express';
import logger from 'heroku-logger';
import favicon from 'serve-favicon';
import forceDomain from 'forcedomain';
import { ApolloEngine } from 'apollo-engine';

import config from '../config';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const app = express();

// Configure view engine.
app.set('views', path.resolve('src/views'));
app.set('view engine', 'hbs');
handlebars.registerPartials(path.resolve('src/views/partials'));

// Serve favicon & static files.
app.use(favicon(path.resolve('public/assets/favicon.ico')));
app.use(express.static('public'));

// Trust proxies & force SSL when in production.
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);

  const hostname = new URL(config('app.url')).hostname;
  app.use(forceDomain({ hostname, protocol: 'https' }));
}

// Use Helmet for security headers.
app.use(helmet({ noCache: true }));

// Allow cross-origin requests from client-side apps.
app.use(cors());

// Register routes & start it up!
(async () => {
  app.use(apiRoutes);
  app.use(await webRoutes());

  const url = config('app.url');
  const port = config('app.port');
  const apolloEngineApiKey = config('engine.key');

  const onStart = () => {
    logger.info(`GraphQL Server is now running on ${url}/graphql`);
    logger.info(`View GraphiQL at ${url}/explore`);
  };

  // Start Apollo Engine server if we have an API key.
  if (apolloEngineApiKey) {
    const engine = new ApolloEngine({
      apiKey: apolloEngineApiKey,
      // Set CORS headers for Automatic Persisted Query support in Apollo Engine.
      // <https://www.apollographql.com/docs/engine/auto-persisted-queries.html#setup>
      frontends: [
        {
          overrideGraphqlResponseHeaders: {
            'Access-Control-Allow-Origin': '*',
          },
        },
      ],
    });

    const engineConfig = {
      graphqlPaths: ['/graphql'],
      expressApp: app,
      port,
    };

    engine.listen(engineConfig, onStart);
  } else {
    // Otherwise, start a plain Express server.
    app.listen(port, onStart);
  }
})();
