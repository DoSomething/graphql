import { URL } from 'url';
import fetchMock from 'fetch-mock';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';

import schema from '../schema';
import config from '../../config';

/**
 * Service URLs for mocking.
 */
export const NORTHSTAR_URL = config('services.northstar.url');

/**
 * Create a matcher for the given URL. It will check whether
 * the domain, path, and any expected query string parameters
 * are included in the given URL.
 *
 * @param {string} expectedUrl
 * @returns {(actualUrl: string) => boolean}
 */
const match = expectedUrl => actualUrl => {
  const url = new URL(actualUrl);
  const expected = new URL(expectedUrl);

  // Is the request on the same domain?
  if (url.host !== expected.host) {
    return false;
  }

  // Is the request for the same path?
  if (url.pathname !== expected.pathname) {
    return false;
  }

  // If we're expecting any query parameters, check
  // that they're included in the URL before matching:
  // expected.searchParams.getAll().
  for (const [key, value] of expected.searchParams) {
    if (url.searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
};

/**
 * Reset any mocks we've set during a test.
 */
export const resetMocks = () => {
  fetchMock.resetBehavior();
};

/**
 * Mock a HTTP request.
 */
export const mock = {
  get: (url, response) => fetchMock.get(match(url), response),
  post: (url, response) => fetchMock.post(match(url), response),
};

/**
 * Create test server & client, and run a query.
 *
 * @param {string} graphqlQuery - The query to run!
 * @param {object} variables - Query variables.
 */
export const query = async (graphqlQuery, variables = {}) => {
  const client = createTestClient(new ApolloServer({ schema }));
  const result = await client.query({ query: graphqlQuery, variables });

  // If GraphQL errors are returned from this query, then throw
  // them as an exception so that they fail our test suite:
  if (result.errors) {
    throw result.errors[0];
  }

  return result;
};
