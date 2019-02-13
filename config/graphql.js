export default {
  /**
   * Whether or not to send 'Cache-Control' annotations
   * in query response (for client-side caching).
   *
   * @type {Boolean}
   */
  cacheControl: true,

  /**
   * We want to enable introspection in all environments. This
   * is handy for developers & our schema is already open-source.
   *
   * @type {Boolean}
   */
  introspection: true,

  /**
   * We disable Apollo's built-in GraphQL Playground support, and
   * instead provide our own (since we can customize it authentication,
   * environment badges, and so on).
   *
   * @type {Boolean}
   */
  playground: false,

  /**
   * Enable performance tracing on requests.
   *
   * @type {Boolean}
   */
  tracing: true,
};
