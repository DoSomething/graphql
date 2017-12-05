import passport from 'passport';
import { Issuer, Strategy } from 'openid-client';

const {
  APP_URL,
  NORTHSTAR_URL,
  NORTHSTAR_AUTH_ID,
  NORTHSTAR_AUTH_SECRET,
} = process.env;

export default (async () => {
  // Configure Northstar client.
  let northstar;

  try {
    northstar = await Issuer.discover(NORTHSTAR_URL);
    console.log(
      `Discovered OpenID Connect configuration from ${NORTHSTAR_URL}.`,
    );
  } catch (exception) {
    console.error(exception);
  }

  const client = new northstar.Client({
    client_id: NORTHSTAR_AUTH_ID,
    client_secret: NORTHSTAR_AUTH_SECRET,
  });

  // Allow 15 second clock skew.
  client.CLOCK_TOLERANCE = 15;

  const params = {
    scope: 'user role:staff role:admin',
    redirect_uri: `${APP_URL}/auth/callback`,
  };

  // Register Passport strategy.
  passport.use(
    'oidc',
    new Strategy({ client, params }, (tokenset, userinfo, done) =>
      done(null, {
        id: userinfo.sub,
        name: userinfo.given_name,
        access_token: tokenset.access_token,
      }),
    ),
  );

  // Configure simple Passport session persistence.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  return passport;
})();
