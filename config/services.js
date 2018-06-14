const environments = {
  /**
   * Querying against local development instances.
   * This will be applied if `QUERY_ENV` is `local`.
   *
   * @type {Object}
   */
  local: {
    displayName: 'local development',

    // Northstar
    northstar: {
      url: process.env.LOCAL_NORTHSTAR_URL || 'http://northstar.test',
      clientId: process.env.LOCAL_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.LOCAL_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      url: process.env.LOCAL_ROGUE_URL || 'http://rogue.test',
    },
  },

  /**
   * Querying against our preview environments (Thor).
   * This will be applied if `QUERY_ENV` is `qa`.
   *
   * @type {Object}
   */
  dev: {
    displayName: 'Development',

    // Northstar
    northstar: {
      url: 'https://identity-dev.dosomething.org',
      clientId: process.env.DEV_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.DEV_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      // @TODO: 'https://rogue-dev.dosomething.org'
      url: 'https://rogue-qa.dosomething.org',
    },
  },

  /**
   * Querying against our preview environments (Thor).
   * This will be applied if `QUERY_ENV` is `qa`.
   *
   * @type {Object}
   */
  qa: {
    displayName: 'QA (Thor)',

    // Northstar
    northstar: {
      url: 'https://identity-qa.dosomething.org',
      clientId: process.env.QA_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.QA_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      // @TODO: 'https://rogue-qa.dosomething.org'
      url: 'https://rogue-thor.dosomething.org',
    },
  },

  /**
   * Querying against our production environments.
   * This will be applied if `QUERY_ENV` is `production`.
   *
   * @type {Object}
   */
  production: {
    displayName: 'production',

    // Northstar
    northstar: {
      url: 'https://profile.dosomething.org',
      clientId: process.env.PRODUCTION_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.PRODUCTION_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      url: 'https://rogue.dosomething.org',
    },
  },
};

// Validate environment choice:
const QUERY_ENV = process.env.QUERY_ENV;
if (!QUERY_ENV || !['local', 'dev', 'qa', 'production'].includes(QUERY_ENV)) {
  throw new Error(
    'The QUERY_ENV environment variable must be "local", "preview", or "production".',
  );
}

export default {
  environment: QUERY_ENV,

  // Merge the relevant config based on 'QUERY_ENV'.
  ...environments[QUERY_ENV],
  northstar: {
    ...environments[QUERY_ENV].northstar,
    scopes: ['user', 'activity', 'write', 'role:staff', 'role:admin'],
  },
};
