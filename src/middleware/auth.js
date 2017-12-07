import passport from 'passport';
import { Issuer, Strategy } from 'openid-client';
import config from '../../config';

export default (async () => {
  // Configure Northstar client.
  let northstar;

  try {
    const url = config('services.northstar.url');
    northstar = await Issuer.discover(url);
    console.log(`Discovered OpenID Connect configuration from ${url}.`);
  } catch (exception) {
    console.error(exception);
  }

  const client = new northstar.Client({
    client_id: config('services.northstar.clientId'),
    client_secret: config('services.northstar.clientSecret'),
  });

  // Allow 15 second clock skew.
  client.CLOCK_TOLERANCE = 15;

  const params = {
    scope: config('services.northstar.scopes').join(' '),
    redirect_uri: `${config('app.url')}/auth/callback`,
  };

  // Register Passport strategy.
  passport.use(
    'oidc',
    new Strategy({ client, params }, (tokenset, userinfo, done) =>
      done(null, {
        id: userinfo.sub,
        name: userinfo.given_name,
        fullName:
          userinfo.given_name +
          (userinfo.family_name ? ` ${userinfo.family_name}` : ''),
        access_token: tokenset.access_token,
      }),
    ),
  );

  // Configure simple Passport session persistence.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  return passport;
})();
