import express from 'express';
import redis from 'connect-redis';
import handlebars from 'hbs';
import session from 'express-session';
import path from 'path';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const { APP_URL, APP_SECRET, PORT, REDIS_URL } = process.env;

const app = express();

// Configure view engine.
app.set('views', path.resolve('src/views'));
app.set('view engine', 'hbs');
handlebars.registerPartials(path.resolve('src/views/partials'));

// Serve static files.
app.use(express.static('public'));

// Configure sessions & authentication.
const RedisStore = redis(session);
app.use(
  session({
    secret: APP_SECRET,
    store: new RedisStore({ url: REDIS_URL }),
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour.
      secure: app.get('env') === 'production',
    },
    saveUninitialized: false,
    resave: false,
  }),
);

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
