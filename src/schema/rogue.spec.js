import { gql } from 'apollo-server';

import { resetMocks, query, RogueMock, NorthstarMock } from './test-helpers';

beforeEach(resetMocks);

describe('Rogue', () => {
  it('can fetch posts', async () => {
    RogueMock.getPosts();

    const { data } = await query(gql`
      {
        posts(count: 3) {
          id
          type
        }
      }
    `);

    expect(data).toEqual({
      posts: [
        {
          id: 1,
          type: 'photo',
        },
        {
          id: 2,
          type: 'photo',
        },
        {
          id: 3,
          type: 'photo',
        },
      ],
    });
  });

  it('can fetch post with user', async () => {
    RogueMock.getPost(15, {
      northstar_id: '5571f4f5a59dbf3c7a8b4569',
    });
    NorthstarMock.getUser('5571f4f5a59dbf3c7a8b4569', {
      first_name: 'Puppet',
    });

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
        id: 15,
        user: {
          firstName: 'Puppet',
        },
      },
    });
  });
});
