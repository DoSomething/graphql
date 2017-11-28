import express from 'express';
import redis from 'connect-redis';
import handlebars from 'hbs';
import session from 'express-session';
import apiRoutes from './routes/api';
import webRoutes from './routes/web';

const { APP_URL, APP_SECRET, PORT, REDIS_URL } = process.env;

(async () => {
  const app = express();

  // Configure view engine.
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  handlebars.registerPartials(__dirname + '/views/partials');

  // Serve static files.
  app.use(express.static('public'))

  // Configure sessions & authentication.
  const RedisStore = redis(session);
  app.use(session({
    secret: APP_SECRET,
    store: new RedisStore({ url: REDIS_URL }),
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour.
    saveUninitialized: false,
    resave: false,
  }));

  app.use(apiRoutes);
  app.use(await webRoutes());

  // Start it up!
  app.listen(PORT, () => {
    console.log(`GraphQL Server is now running on ${APP_URL}/graphql`);
    console.log(`View GraphiQL at ${APP_URL}/explore`);
  });
})();

