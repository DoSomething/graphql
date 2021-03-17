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

const airtable = {
  apiKey: process.env.AIRTABLE_API_KEY,
  url: 'https://api.airtable.com',
  /**
   * Airtable bases are like different databases, each containing its own tables.
   *
   * We use Airtable to manage some campaigns or programs (like clubs). At the moment, the only base
   * we need to expose data from is for voter registration.
   */
  bases: {
    voterRegistration: 'appLExb7T5gTM22pc',
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

    // Airtable
    airtable,

    // Contentful
    contentful,

    // Northstar
    northstar: {
      url: process.env.LOCAL_NORTHSTAR_URL || 'http://northstar.test',
    },

    // Phoenix
    phoenix: {
      url: process.env.LOCAL_PHOENIX_URL || 'http://phoenix.test',
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

    // Airtable
    airtable,

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
      url:
        process.env.DEV_NORTHSTAR_URL || 'https://identity-dev.dosomething.org',
    },

    // Phoenix
    phoenix: {
      url: process.env.DEV_PHOENIX_URL || 'https://dev.dosomething.org',
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

    // Airtable
    airtable,

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
      url:
        process.env.QA_NORTHSTAR_URL || 'https://identity-qa.dosomething.org',
    },

    // Phoenix
    phoenix: {
      url: process.env.QA_PHOENIX_URL || 'https://qa.dosomething.org',
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

    // Airtable
    airtable,

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
      url:
        process.env.PRODUCTION_NORTHSTAR_URL ||
        'https://identity.dosomething.org',
    },

    // Phoenix
    phoenix: {
      url: process.env.PRODUCTION_PHOENIX_URL || 'https://www.dosomething.org',
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
