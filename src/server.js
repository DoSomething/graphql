import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import handlebars from 'hbs';
import { schema } from './schema';
import session from 'express-session';
import auth from './auth';

const { APP_URL, APP_SECRET, PORT } = process.env;

(async () => {
  const app = express();
  const passport = await auth;

  // Configure view engine.
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  handlebars.registerPartials(__dirname + '/views/partials');

  // Attach global middleware.
  app.use(express.static('public'))
  app.use(session({ secret: APP_SECRET, cookie: { maxAge: 3600 }, resave: true, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use(passport.session());

  // * /graphql
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

  // * /graphiql
  app.get('/graphiql', (req, res) => res.render('graphiql', { user: req.user }));

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
    console.log(`GraphQL Server is now running on http://${APP_URL}/graphql`);
    console.log(`View GraphiQL at http://${APP_URL}/explore`);
  });
})();

