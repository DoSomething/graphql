export default {
  /**
   * Catbox cache settings for embeds.
   *
   * @type {Object}
   */
  cache: {
    name: 'embed',
    expiresIn: 3600 * 1000, // 1 hour (3600 seconds).
  },

  /**
   * We whitelist "safe" domains to embed rich content from, to prevent
   * malicious HTML content from being injected onto a page.
   *
   * @type {Array}
   */
  whitelist: [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'youtu.be',
    'youtube.com',
  ],
};
