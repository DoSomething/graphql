import { gql } from 'apollo-server';

import { resetMocks, query, NorthstarMock } from './test-helpers';

beforeEach(resetMocks);

describe('Northstar', () => {
  it('can fetch a user', async () => {
    NorthstarMock.get('/v2/users/5571f4f5a59dbf3c7a8b4569', {
      data: {
        id: '5571f4f5a59dbf3c7a8b4569',
        first_name: 'Puppet',
        last_initial: 'S',
      },
    });

    const { data } = await query(gql`
      {
        user(id: "5571f4f5a59dbf3c7a8b4569") {
          firstName
          lastInitial
        }
      }
    `);

    expect(data).toEqual({
      user: {
        firstName: 'Puppet',
        lastInitial: 'S',
      },
    });
  });

  it('can fetch a user with optional fields', async () => {
    NorthstarMock.get('/v2/users/5571f4f5a59dbf3c7a8b4569', {
      data: {
        id: '5571f4f5a59dbf3c7a8b4569',
        first_name: 'Puppet',
        last_name: 'Sloth',
      },
    });

    const { data } = await query(gql`
      {
        user(id: "5571f4f5a59dbf3c7a8b4569") {
          firstName
          lastName
        }
      }
    `);

    expect(data).toEqual({
      user: {
        firstName: 'Puppet',
        lastName: 'Sloth',
      },
    });
  });

  it('can fetch a user with feature flag', async () => {
    NorthstarMock.get('/v2/users/5571f4f5a59dbf3c7a8b4569', {
      data: {
        id: '5571f4f5a59dbf3c7a8b4569',
        feature_flags: { badges: true },
      },
    });

    const { data } = await query(gql`
      {
        user(id: "5571f4f5a59dbf3c7a8b4569") {
          hasBadges: hasFeatureFlag(feature: "badges")
        }
      }
    `);

    expect(data).toEqual({
      user: {
        hasBadges: true,
      },
    });
  });
});
