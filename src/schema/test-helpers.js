import { omit, range } from 'lodash';
import Chance from 'chance';
import fetch from 'fetch-mock';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';

import schema from './index';

const NORTHSTAR_URL = 'identity-dev.dosomething.org';
const ROGUE_URL = 'activity-dev.dosomething.org';
const MAXIMUM_POSTS = 50;

export const resetMocks = () => {
  fetch.resetBehavior();
};

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

  if (url.host !== host) {
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
    return fetch.mock(match(NORTHSTAR_URL, path), response, { method: 'get' });
  }

  static getUser(id, overrides = {}) {
    return this.get(`/v2/users/${id}`, href => {
      const url = new URL(href);
      const includes = (url.searchParams.get('include') || '')
        .split(',')
        .filter(item => item !== '');

      // Optional fields which must be queried via `?include`. <https://git.io/Je3ec>
      const optionalFields = [
        'email',
        'mobile',
        'last_name',
        'addr_street1',
        'addr_street2',
        'birthdate',
      ];

      // Build a fake user response <https://git.io/Je3fo>, with optional overrides
      // provided for the specific test case. Only include optional fields if queried.
      const chance = new Chance(id);
      const data = omit(
        {
          id,
          first_name: chance.first(),
          last_name: chance.last(),
          last_initial: chance.letter({ casing: 'upper' }),
          email: chance.email(),
          age: chance.age(),
          birthdate: chance.birthday({ string: true }),
          ...overrides,
        },
        ...optionalFields.filter(field => !includes.includes(field)),
      );

      return { data };
    });
  }
}

/**
 * Create mocked Northstar responses.
 */
export class RogueMock {
  static get(path, response) {
    return fetch.mock(match(ROGUE_URL, path), response, { method: 'get' });
  }

  static post(id, overrides = {}) {
    const chance = new Chance(id);

    return {
      id,
      type: 'photo',
      text: chance.sentence({ words: 5 }),
      ...overrides,
    };
  }

  static getPost(id, overrides = {}) {
    return this.get(`/api/v3/posts/${id}`, () => {
      return { data: this.post(id, overrides) };
    });
  }

  static getPosts(count = MAXIMUM_POSTS, overrides = {}) {
    return this.get(`/api/v3/posts/`, href => {
      const url = new URL(href);
      const queryString = url.searchParams;
      const limit = Number(
        queryString.get('limit') || Number.POSITIVE_INFINITY,
      );

      return {
        // Return the requested number of mock posts, the count
        // requested by the query, or the maximum set by Rogue:
        data: range(1, Math.min(count, limit) + 1).map(id =>
          this.post(id, overrides),
        ),
      };
    });
  }
}
