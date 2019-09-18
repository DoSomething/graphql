import { URL } from 'url';
import fetch from 'fetch-mock';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';

import schema from '../schema';

/**
 * Service URLs for mocking.
 */
export const NORTHSTAR_URL = 'https://identity-dev.dosomething.org';
export const ROGUE_URL = 'https://activity-dev.dosomething.org';

/**
 * Match a given path & hostname.
 *
 * @param {string} path
 */
const match = expectedUrl => actualUrl => {
  const url = new URL(actualUrl);
  const expected = new URL(expectedUrl);

  if (url.host !== expected.host) {
    return false;
  }

  if (url.pathname !== expected.pathname) {
    return false;
  }

  return true;
};

/**
 * Reset any mocks we've set during a test.
 */
export const resetMocks = () => {
  fetch.resetBehavior();
};

/**
 * Mock a HTTP request.
 */
export const mock = {
  get: (url, response) => fetch.mock(match(url), response, { method: 'get' }),
  post: (url, response) => fetch.mock(match(url), response, { method: 'post' }),
};

/**
 * Create test server & client, and run a query.
 *
 * @param {string} graphqlQuery - The query to run!
 * @param {object} variables - Query variables.
 */
export const query = (graphqlQuery, variables = {}) => {
  const client = createTestClient(new ApolloServer({ schema }));
  return client.query({ query: graphqlQuery, variables });
};
