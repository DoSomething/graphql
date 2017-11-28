import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import redis from 'connect-redis';
import handlebars from 'hbs';
import { schema } from './schema';
import session from 'express-session';
import auth from './auth';
import markdown from './markdown';

const { APP_URL, APP_SECRET, PORT, REDIS_URL } = process.env;

(async () => {
  const app = express();
  const passport = await auth;

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

  // * /graphql
  app.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
    context: { authorization: request.header('authorization') },
    schema
  })));

  app.use(passport.initialize());
  app.use(passport.session());

  // * /graphiql
  app.use('/graphiql', graphiqlExpress(request => ({
    endpointURL: '/graphql',
    passHeader: request.user ? `'Authorization': 'Bearer ${request.user.access_token}'` : null,
  })));

  // * /docs
  app.get('/docs/*', await markdown({ source: __dirname + '/../docs' }));
  app.get('/docs', (req, res) => res.redirect('/docs/README.md'));

  // GET /
  app.get('/', (req, res) => res.render('home', { user: req.user }));

  // GET /explore
  app.get('/explore', (req, res) => res.render('explore', { user: req.user }));

  // GET /auth/login
  app.get('/auth/login', passport.authenticate('oidc'));

  // GET /auth/callback
  app.get('/auth/callback',
    passport.authenticate('oidc', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/'),
  );

  // GET /auth/logout
  app.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  // Start it up!
  app.listen(PORT, () => {
    console.log(`GraphQL Server is now running on ${APP_URL}/graphql`);
    console.log(`View GraphiQL at ${APP_URL}/explore`);
  });
})();

