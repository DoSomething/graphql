import { gql } from 'apollo-server';

import factory from './factories';
import { resetMocks, mock, query, NORTHSTAR_URL } from './helpers';

beforeEach(resetMocks);

describe('Northstar', () => {
  it('can fetch a user', async () => {
    const user = await factory('user', { id: '5d82aae0d36430dfb1cf03dc' });

    mock.get(`${NORTHSTAR_URL}/v2/users/${user.id}`, { data: user });

    const { data } = await query(gql`
      {
        user(id: "5d82aae0d36430dfb1cf03dc") {
          firstName
          lastInitial
        }
      }
    `);

    expect(data).toEqual({
      user: {
        firstName: user.first_name,
        lastInitial: user.last_initial,
      },
    });
  });

  it('can fetch a user with optional fields', async () => {
    const user = await factory('user', { id: '5d82aae0d36430dfb1cf03dc' });

    mock.get(`${NORTHSTAR_URL}/v2/users/${user.id}?include=last_name`, {
      data: user,
    });

    const { data } = await query(gql`
      {
        user(id: "5d82aae0d36430dfb1cf03dc") {
          firstName
          lastName
        }
      }
    `);

    expect(data).toEqual({
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  });

  it('can fetch number suffixed optional user fields', async () => {
    const user = await factory('user', {
      id: '5d82aae0d36430dfb1cf03dc',
      addr_street1: '21 w 21st street',
    });

    mock.get(`${NORTHSTAR_URL}/v2/users/${user.id}?include=addr_street1`, {
      data: user,
    });

    const { data } = await query(gql`
      {
        user(id: "5d82aae0d36430dfb1cf03dc") {
          addrStreet1
        }
      }
    `);

    expect(data).toEqual({
      user: {
        addrStreet1: user.addr_street1,
      },
    });
  });

  it('can fetch a user with feature flag', async () => {
    const user = await factory('user', {
      id: '5d82aae0d36430dfb1cf03dc',
      feature_flags: { badges: true },
    });

    mock.get(`${NORTHSTAR_URL}/v2/users/${user.id}`, { data: user });

    const { data } = await query(gql`
      {
        user(id: "5d82aae0d36430dfb1cf03dc") {
          hasBadges: hasFeatureFlag(feature: "badges")
        }
      }
    `);

    expect(data).toEqual({ user: { hasBadges: true } });
  });
});
