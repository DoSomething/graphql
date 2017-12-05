import express from 'express';
import handlebars from 'hbs';
import path from 'path';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const { APP_URL, PORT } = process.env;

const app = express();

// Configure view engine.
app.set('views', path.resolve('src/views'));
app.set('view engine', 'hbs');
handlebars.registerPartials(path.resolve('src/views/partials'));

// Serve static files.
app.use(express.static('public'));

// Trust proxies when running on Heroku.
if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
}

// Register routes & start it up!
(async () => {
  app.use(apiRoutes);
  app.use(await webRoutes());

  app.listen(PORT, () => {
    console.log(`GraphQL Server is now running on ${APP_URL}/graphql`);
    console.log(`View GraphiQL at ${APP_URL}/explore`);
  });
})();
