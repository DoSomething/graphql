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

  it('can fetch a club by ID', async () => {
    const club = await factory('club', { id: 71 });

    mock.get(`${ROGUE_URL}/api/v3/clubs/71`, { data: club });

    const { data } = await query(gql`
      {
        club(id: 71) {
          id
          name
        }
      }
    `);

    expect(data.club.name).toEqual(club.name);
  });

  it('can fetch clubs', async () => {
    const clubs = await factory('club', 5);

    mock.get(`${ROGUE_URL}/api/v3/clubs`, { data: clubs });

    const { data } = await query(gql`
      {
        clubs {
          id
          name
        }
      }
    `);

    expect(data.clubs).toHaveLength(5);
  });

  it('can fetch a group by ID', async () => {
    const group = await factory('group', { id: 71 });

    mock.get(`${ROGUE_URL}/api/v3/groups/71`, { data: group });

    const { data } = await query(gql`
      {
        group(id: 71) {
          id
          name
        }
      }
    `);

    expect(data.group.name).toEqual(group.name);
  });

  it('can fetch groups', async () => {
    const groups = await factory('group', 5, { group_type_id: 1 });

    mock.get(`${ROGUE_URL}/api/v3/groups/?`, { data: groups });

    const { data } = await query(gql`
      {
        groups(groupTypeId: 1) {
          id
          name
        }
      }
    `);

    expect(data.groups).toHaveLength(5);
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
