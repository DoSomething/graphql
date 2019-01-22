import { Router } from 'express';
import redis from 'connect-redis';
import session from 'express-session';
import path from 'path';
import config from '../../config';
import authMiddleware from '../middleware/auth';
import viewMiddleware from '../middleware/views';
import markdown from './markdown';

export default async () => {
  const router = Router();

  // Wait until we discover OpenID Configuration.
  const passport = await authMiddleware;

  // Configure sessions & authentication.
  const RedisStore = redis(session);
  router.use(
    session({
      secret: config('app.secret'),
      store: new RedisStore({ url: config('cache.url') }),
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour.
        secure: !config('app.debug'),
      },
      saveUninitialized: false,
      proxy: !config('app.debug'),
      resave: false,
    }),
  );

  // Attach web middleware.
  router.use(passport.initialize());
  router.use(passport.session());
  router.use(viewMiddleware);

  // GET /
  router.get('/', (req, res) => res.render('home', { user: req.user }));

  // GET /explore
  router.get('/explore', (req, res) =>
    res.render('explore', { user: req.user }),
  );

  // GET /docs
  router.get('/docs', (req, res) => res.redirect('/docs/README.md'));
  router.get('/docs/*', markdown({ source: path.resolve('docs') }));

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
    const northstarUrl = config('services.northstar.url');
    res.redirect(`${northstarUrl}/logout?redirect=${config('app.url')}`);
  });

  return router;
};
