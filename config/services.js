const environments = {
  displayName: 'local development',
  local: {
    northstar: {
      url: process.env.LOCAL_NORTHSTAR_URL || 'http://northstar.dev',
      clientId: process.env.LOCAL_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.LOCAL_NORTHSTAR_AUTH_SECRET,
    },
    rogue: {
      url: process.env.LOCAL_ROGUE_URL || 'http://rogue.dev',
    },
  },

  production: {
    displayName: 'production',
    northstar: {
      url: 'https://profile.dosomething.org',
      clientId: process.env.PRODUCTION_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.PRODUCTION_NORTHSTAR_AUTH_SECRET,
    },
    rogue: {
      url: 'https://rogue.dosomething.org',
    },
  },

  preview: {
    displayName: 'Preview (Thor)',
    northstar: {
      url: 'https://northstar-thor.dosomething.org',
      clientId: process.env.PREVIEW_NORTHSTAR_AUTH_ID,
      clientSecret: process.env.PREVIEW_NORTHSTAR_AUTH_SECRET,
    },
    rogue: {
      url: 'https://rogue-thor.dosomething.org',
    },
  },
};

// Validate environment choice:
const QUERY_ENV = process.env.QUERY_ENV;
if (!QUERY_ENV || !['local', 'production', 'preview'].includes(QUERY_ENV)) {
  throw new Error(
    'The QUERY_ENV environment variable must be "local", "preview", or "production".',
  );
}

export default {
  environment: QUERY_ENV,
  ...environments[QUERY_ENV],
  northstar: {
    ...environments[QUERY_ENV].northstar,
    scopes: ['user', 'role:staff', 'role:admin'],
  },
};
