export default {
  /**
   * Catbox cache settings for OEmbeds.
   *
   * @type {Object}
   */
  cache: {
    name: 'oembed',
    expiresIn: 3600 * 1000, // 1 hour (3600 seconds).
  },

  /**
   * We whitelist "safe" domains to embed rich content from, to prevent
   * malicious content from being injected onto a page.
   *
   * @type {Array}
   */
  whitelist: [
    'dosomething.org',
    'buzzfeed.com',
    'buzzfeednews.com',
    'facebook.com',
    'instagram.com',
    'nytimes.com',
    'twitter.com',
    'youtu.be',
    'youtube.com',
  ],

  /**
   * For some sites, we prefer OpenGraph/Twitter metatags. Note that these
   * sites still must be whitelisted above!
   *
   * @type {Array}
   */
  preferMetatags: [
    'buzzfeed.com',
    'buzzfeednews.com',
    'dosomething.org',
    'nytimes.com',
  ],
};
