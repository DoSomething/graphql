import path from 'path';
import cors from 'cors';
import boxen from 'boxen';
import chalk from 'chalk';
import { URL } from 'url';
import helmet from 'helmet';
import handlebars from 'hbs';
import express from 'express';
import logger from 'heroku-logger';
import favicon from 'serve-favicon';
import forceDomain from 'forcedomain';
import { ApolloEngine } from 'apollo-engine';
import { ApolloServer } from 'apollo-server-express';

import schema from './schema';
import config from '../config';
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

// Allow cross-origin requests from client-side apps,
// including 'OPTIONS' for pre-flight requests.
app.use(cors());
app.options('*', cors());

// Register routes & start it up!
(async () => {
  const url = config('app.url');
  const port = config('app.port');
  const apolloEngineApiKey = config('engine.key');

  // Configure Apollo Server 2.x:
  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    context: ({ req }) => ({
      authorization: req.headers.authorization || '',
    }),
  });

  server.applyMiddleware({ app });
  app.use(await webRoutes());

  const onStart = () => {
    logger.info(`GraphQL Server is now running on ${url}/graphql`);

    if (app.get('env') !== 'production') {
      const ENV = chalk.yellow.bold(config('services.displayName'));
      const EXPLORE_URL = chalk.underline.bold(`${url}/explore`);
      const message = `${chalk.bold(
        `Started your local GraphQL server, querying the ${ENV} environment.`,
      )} \nTry it out by visiting ${EXPLORE_URL}.`;

      console.log(
        boxen(message, {
          borderColor: 'yellow',
          margin: 1,
          padding: 1,
        }),
      );
    }
  };

  // Otherwise, start a plain Express server.
  app.listen(port, onStart);
})();
