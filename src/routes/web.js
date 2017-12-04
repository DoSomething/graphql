import { Router } from 'express';
import { graphiqlExpress } from 'apollo-server-express';
import path from 'path';
import defaultQuery from '../schema/defaultQuery';
import authMiddleware from '../middleware/auth';
import viewMiddleware from '../middleware/views';
import markdown from './markdown';

const { APP_URL, NORTHSTAR_URL } = process.env;

export default async () => {
  const router = Router();

  // Wait until we discover OpenID Configuration.
  const passport = await authMiddleware;

  // Attach web middleware.
  router.use(passport.initialize());
  router.use(passport.session());
  router.use(viewMiddleware);

  // * /graphiql
  router.use(
    '/graphiql',
    graphiqlExpress(request => ({
      endpointURL: '/graphql',
      passHeader: request.user
        ? `'Authorization': 'Bearer ${request.user.access_token}'`
        : null,
      query: defaultQuery,
    })),
  );

  // GET /
  router.get('/', (req, res) => res.render('home', { user: req.user }));

  // GET /explore
  router.get('/explore', (req, res) =>
    res.render('explore', { user: req.user }),
  );

  // GET /docs
  router.get('/docs', (req, res) => res.redirect('/docs/README.md'));
  router.get('/docs/*', markdown({ source: path.resolve('../../docs') }));

  // GET /auth/login
  router.get('/auth/login', passport.authenticate('oidc'));

  // GET /auth/callback
  router.get(
    '/auth/callback',
    passport.authenticate('oidc', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/explore'),
  );

  // GET /auth/logout
  router.get('/auth/logout', (req, res) => {
    req.logout();

    // Kill the Northstar SSO session & redirect back.
    res.redirect(`${NORTHSTAR_URL}/logout?redirect=${APP_URL}`);
  });

  return router;
};
