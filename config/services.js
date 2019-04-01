import { get } from 'lodash';

// Map our environments (local, dev, QA, and production) to the
// corresponding Contentful environments (e.g. production -> master).
const environmentMapping = {
  local: 'dev',
  dev: 'dev',
  qa: 'qa',
  production: 'master',
};

const contentful = {
  phoenix: {
    spaceId: process.env.PHOENIX_CONTENTFUL_SPACE_ID,
    accessToken: process.env.PHOENIX_CONTENTFUL_ACCESS_TOKEN,
    previewToken: process.env.PHOENIX_CONTENTFUL_PREVIEW_TOKEN,
    environment: get(environmentMapping, process.env.QUERY_ENV),
    cache: {
      name: 'phoenixContent',
      expiresIn: 3600 * 1000, // 1 hour (3600 seconds).
    },
  },

  // Gambit uses a single space/environment used across all GraphQL environments.
  gambit: {
    spaceId: process.env.GAMBIT_CONTENTFUL_SPACE_ID,
    accessToken: process.env.GAMBIT_CONTENTFUL_ACCESS_TOKEN,
    cache: {
      name: 'gambitContent',
      expiresIn: 3600 * 1000, // 1 hour (3600 seconds).
    },
  },
};

const environments = {
  /**
   * Querying against local development instances.
   * This will be applied if `QUERY_ENV` is `local`.
   *
   * @type {Object}
   */
  local: {
    displayName: 'local development',

    // Contentful
    contentful,

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

    // Contentful
    contentful,

    // Gambit
    gambit: {
      // Note: Gambit doesn't have a dev instance, so we use QA.
      url: 'https://gambit-conversations-staging.herokuapp.com',
      user: process.env.QA_GAMBIT_BASIC_AUTH_USER,
      pass: process.env.QA_GAMBIT_BASIC_AUTH_PASS,
    },

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

    // Contentful
    contentful,

    // Gambit
    gambit: {
      url: 'https://gambit-conversations-staging.herokuapp.com',
      user: process.env.QA_GAMBIT_BASIC_AUTH_USER,
      pass: process.env.QA_GAMBIT_BASIC_AUTH_PASS,
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

    // Contentful
    contentful,

    // Gambit
    gambit: {
      url: 'https://gambit-conversations-prod.herokuapp.com',
      user: process.env.PRODUCTION_GAMBIT_BASIC_AUTH_USER,
      pass: process.env.PRODUCTION_GAMBIT_BASIC_AUTH_PASS,
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
