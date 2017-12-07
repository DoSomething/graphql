export default {
  /**
   * The base application URL, used to redirect to canonical
   * URL & create OAuth redirect URI.
   *
   * @type {String}
   */
  url: process.env.APP_URL,

  /**
   * The application environment where the GraphQL gateway
   * is running (either 'local', 'preview', or 'production').
   * This will set the "badge" on the corner of the page.
   *
   * @type {Boolean}
   */
  env: process.env.APP_ENV,

  /**
   * The port that traffic should be served from.
   *
   * @type {String}
   */
  port: process.env.PORT || 3000,

  /**
   * A secret used to sign the application's cookies.
   *
   * @type {String}
   */
  secret: process.env.APP_SECRET,

  /**
   * Are we running in a production environment? This hide
   * stack traces from the user, force HTTPS and secure cookies,
   * and configure the app to run behind a proxy.
   *
   * @type {Boolean}
   */
  debug: process.env.NODE_ENV !== 'production',
};
