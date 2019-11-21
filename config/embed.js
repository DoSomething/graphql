export default {
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
