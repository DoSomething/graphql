import gql from 'tagged-template-noop';

export default gql`
  # Type a GraphQL query into this side of the screen, and then hit
  # the "play" button above to run the query and see the results!

  # For the latest schema, hit the "Docs" sidebar on the right side
  # of the page, or just start typing for live autocomplete!

  # Here's an example query for a reportback gallery:
  {
    posts(count: 5) {
      status
      media {
        url(w: 300, h: 300)
        text
      }
      user {
        firstName
        lastName
      }
    }
  }
`;
