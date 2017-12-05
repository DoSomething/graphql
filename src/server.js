import express from 'express';
import handlebars from 'hbs';
import favicon from 'serve-favicon';
import path from 'path';
import helmet from 'helmet';
import { URL } from 'url';
import forceDomain from 'forcedomain';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const { APP_URL, PORT } = process.env;

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

  const hostname = new URL(APP_URL).hostname;
  app.use(forceDomain({ hostname, protocol: 'https' }));
}

// Use Helmet for security headers.
app.use(helmet({ noCache: true }));

// Register routes & start it up!
(async () => {
  app.use(apiRoutes);
  app.use(await webRoutes());

  app.listen(PORT, () => {
    console.log(`GraphQL Server is now running on ${APP_URL}/graphql`);
    console.log(`View GraphiQL at ${APP_URL}/explore`);
  });
})();
