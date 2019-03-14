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
   * We whitelist "safe" domains to embed content from, since this could
   * otherwise allow malicious content to be injected onto a page.
   *
   * @type {Array}
   */
  whitelist: [
    'dosomething.carto.com',
    'dosomething.org',
    'facebook.com',
    'instagram.com',
    'nytimes.com',
    'twitter.com',
    'youtu.be',
    'youtube.com',
  ],
};
