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
  // Global Contentful cache. This should be used for any spaces
  // that have a webhook enabled for cache clearing.
  cache: {
    name: 'contentful',
    expiresIn: 24 * 3600 * 1000, // 24 hours (3600 seconds per hour).
  },

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
    },

    // Aurora
    aurora: {
      url: process.env.LOCAL_AURORA_URL || 'http://aurora.test',
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
    },

    // Aurora
    aurora: {
      url: 'https://admin-dev.dosomething.org',
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
    },

    // Aurora
    aurora: {
      url: 'https://admin-qa.dosomething.org',
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
    },

    // Aurora
    aurora: {
      url: 'https://admin.dosomething.org',
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
