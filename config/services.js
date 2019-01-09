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
      url: 'https://activity-dev.dosomething.org',
    },
  },

  /**
   * Querying against our preview environments (Thor).
   * This will be applied if `QUERY_ENV` is `qa`.
   *
   * @type {Object}
   */
  qa: {
    displayName: 'QA',

    // Gambit
    gambitContent: {
      url: 'https://ds-mdata-responder-staging.herokuapp.com',
      // TODO: Validate requests with Northstar token instead of Gambit header token.
      apiKey: process.env.QA_GAMBIT_CONTENT_API_KEY,
    },
    gambitConversations: {
      url: 'https://gambit-conversations-staging.herokuapp.com',
      // TODO: Validate requests with Northstar token instead of Gambit basic auth.
      user: process.env.QA_GAMBIT_CONVERSATIONS_USER,
      pass: process.env.QA_GAMBIT_CONVERSATIONS_PASS,
    },

    // Northstar
    northstar: {
      url: 'https://identity-qa.dosomething.org',
      clientId: process.env.QA_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.QA_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      url: 'https://activity-qa.dosomething.org',
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

    // Gambit
    gambitContent: {
      url: 'https://ds-mdata-responder.herokuapp.com',
      // TODO: Validate requests with Northstar token instead of Gambit header token.
      apiKey: process.env.PRODUCTION_GAMBIT_CONTENT_API_KEY,
    },
    gambitConversations: {
      url: 'https://gambit-conversations-prod.herokuapp.com',
      // TODO: Validate requests with Northstar token instead of Gambit basic auth.
      user: process.env.PRODUCTION_GAMBIT_CONVERSATIONS_USER,
      pass: process.env.PRODUCTION_GAMBIT_CONVERSATIONS_PASS,
    },

    // Northstar
    northstar: {
      url: 'https://identity.dosomething.org',
      clientId: process.env.PRODUCTION_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.PRODUCTION_NORTHSTAR_AUTH_SECRET,
    },

    // Rogue
    rogue: {
      url: 'https://activity.dosomething.org',
    },
  },
};

// Validate environment choice:
const QUERY_ENV = process.env.QUERY_ENV;
if (!QUERY_ENV || !['local', 'dev', 'qa', 'production'].includes(QUERY_ENV)) {
  throw new Error(
    'The QUERY_ENV environment variable must be "local", "dev", "qa", or "production".',
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
