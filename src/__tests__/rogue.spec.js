import { gql } from 'apollo-server';

import factory from './factories';
import { resetMocks, query, mock, NORTHSTAR_URL, ROGUE_URL } from './helpers';

beforeEach(resetMocks);

describe('Rogue', () => {
  it('can fetch posts', async () => {
    const posts = await factory('post', 3);

    mock.get(`${ROGUE_URL}/api/v3/posts/`, { data: posts });

    const { data } = await query(gql`
      {
        posts(count: 3) {
          id
          type
        }
      }
    `);

    expect(data.posts).toHaveLength(3);
  });

  it('can fetch post with user', async () => {
    const post = await factory('post', { id: 15 });
    const user = await factory('user', { id: post.northstar_id });

    mock.get(`${ROGUE_URL}/api/v3/posts/${post.id}`, { data: post });
    mock.get(`${NORTHSTAR_URL}/v2/users/${user.id}`, { data: user });

    const { data } = await query(gql`
      {
        post(id: 15) {
          id
          user {
            firstName
          }
        }
      }
    `);

    expect(data).toEqual({
      post: {
        id: post.id,
        user: {
          firstName: user.first_name,
        },
      },
    });
  });

  it('can fetch post with impact', async () => {
    const post = await factory('post', { id: 321, quantity: 32 });

    mock.get(`${ROGUE_URL}/api/v3/posts/321`, { data: post });

    const { data } = await query(gql`
      {
        post(id: 321) {
          type
          impact
        }
      }
    `);

    expect(data.post.impact).toEqual('32 Things Done');
  });

  it('can fetch a group type by ID', async () => {
    const groupType = await factory('group-type', { id: 7 });

    mock.get(`${ROGUE_URL}/api/v3/group-types/7`, { data: groupType });

    const { data } = await query(gql`
      {
        groupType(id: 7) {
          id
          name
        }
      }
    `);
    expect(data.groupType.name).toEqual(groupType.name);
  });

  it('can fetch group types', async () => {
    const groupTypes = await factory('group-type', 3);

    mock.get(`${ROGUE_URL}/api/v3/group-types`, { data: groupTypes });

    const { data } = await query(gql`
      {
        groupTypes {
          id
          name
        }
      }
    `);

    expect(data.groupTypes).toHaveLength(3);
  });
});
