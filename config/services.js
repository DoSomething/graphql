import { get } from 'lodash';

// Map our environments (local, dev, QA, and production) to the
// corresponding Algolia environment prefix (e.g. dev -> development).
const algoliaEnvironmentMap = {
  local: 'local',
  dev: 'development',
  qa: 'qa',
  production: 'production',
};

// Map our environments (local, dev, QA, and production) to the
// corresponding Contentful environments (e.g. production -> master).
const contentfulEnvironmentMap = {
  local: 'dev',
  dev: 'dev',
  qa: 'qa',
  production: 'master',
};

const algolia = {
  appId: process.env.ALGOLIA_APP_ID,
  secret: process.env.ALGOLIA_SECRET,
  prefix: get(algoliaEnvironmentMap, process.env.QUERY_ENV),
};

const contentful = {
  phoenix: {
    spaceId: process.env.PHOENIX_CONTENTFUL_SPACE_ID,
    accessToken: process.env.PHOENIX_CONTENTFUL_ACCESS_TOKEN,
    previewToken: process.env.PHOENIX_CONTENTFUL_PREVIEW_TOKEN,
    environment: get(contentfulEnvironmentMap, process.env.QUERY_ENV),
  },

  // Gambit uses a single space/environment used across all GraphQL environments.
  gambit: {
    spaceId: process.env.GAMBIT_CONTENTFUL_SPACE_ID,
    accessToken: process.env.GAMBIT_CONTENTFUL_ACCESS_TOKEN,
  },
};

const schools = {
  db: {
    url: process.env.SCHOOLS_DB_URL,
    name: 'greatschools',
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

    // Phoenix
    phoenix: {
      url: process.env.LOCAL_PHOENIX_URL || 'http://phoenix.test',
    },

    // Rogue
    rogue: {
      url: process.env.LOCAL_ROGUE_URL || 'http://rogue.test',
    },

    // Schools
    schools,
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

    // Phoenix
    phoenix: {
      url: 'https://dev.dosomething.org',
    },

    // Rogue
    rogue: {
      url: 'https://activity-dev.dosomething.org',
    },

    // Schools
    schools,
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

    // Phoenix
    phoenix: {
      url: 'https://qa.dosomething.org',
    },

    // Rogue
    rogue: {
      url: 'https://activity-qa.dosomething.org',
    },

    // Schools
    schools,
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

    // Phoenix
    phoenix: {
      url: 'https://www.dosomething.org',
    },

    // Rogue
    rogue: {
      url: 'https://activity.dosomething.org',
    },

    // Schools
    schools,
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

  algolia,

  // Merge the relevant config based on 'QUERY_ENV'.
  ...environments[QUERY_ENV],
  northstar: {
    ...environments[QUERY_ENV].northstar,
    scopes: ['user', 'activity', 'write', 'role:staff', 'role:admin'],
  },
};
