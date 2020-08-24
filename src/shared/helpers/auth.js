/**
 * Attach the user's authorization token to a request.
 *
 * @return {Object}
 */
export const authorizedRequest = context => {
  if (!context.authorization) {
    return { headers: { Accept: 'application/json' } };
  }

  return {
    headers: {
      Accept: 'application/json',
      Authorization: context.authorization,
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Require an authorization token for this request.
 *
 * @return {Object}
 */
export const requireAuthorizedRequest = context => {
  if (!context.authorization) {
    throw new Error('An access token is required for this query/mutation.');
  }

  return authorizedRequest(context);
};
