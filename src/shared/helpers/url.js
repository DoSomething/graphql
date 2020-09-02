import { URL, URLSearchParams } from 'url';
import { isUndefined, omit } from 'lodash';

/**
 * Append a URL with optional query string arguments.
 *
 * @param {String} path
 * @param {Object} args
 * @return {String}
 */
export const urlWithQuery = (path, args) => {
  try {
    const url = new URL(path);

    // Replace existing query params with given arguments.
    url.search = new URLSearchParams(omit(args, isUndefined));

    return url.toString();
  } catch (exception) {
    // If we get mangled 'default' as URL, return null.
    return null;
  }
};
