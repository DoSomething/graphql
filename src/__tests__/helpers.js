import { URL } from 'url';
import fetch from 'fetch-mock';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';

import schema from '../schema';

export const resetMocks = () => {
  fetch.resetBehavior();
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

/**
 * Match a given path & hostname.
 *
 * @param {string} path
 */
const match = (host, path) => href => {
  const url = new URL(href);
  const expected = new URL(path, host);

  if (url.host !== expected.host) {
    return false;
  }

  if (url.pathname !== path) {
    return false;
  }

  return true;
};

/**
 * Create mocked Northstar responses.
 */
export class NorthstarMock {
  static get(path, response) {
    const NORTHSTAR_URL = 'https://identity-dev.dosomething.org';
    return fetch.mock(match(NORTHSTAR_URL, path), response, { method: 'get' });
  }
}

/**
 * Create mocked Northstar responses.
 */
export class RogueMock {
  static get(path, response) {
    const ROGUE_URL = 'https://activity-dev.dosomething.org';
    return fetch.mock(match(ROGUE_URL, path), response, { method: 'get' });
  }
}
