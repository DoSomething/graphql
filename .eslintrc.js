module.exports = {
  extends: '@dosomething/eslint-config/server',
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },
  globals: {
    fetch: false,
  },
  env: {
    jest: true,
  },
  rules: {
    // Allow using '_' as a placeholder for unused arguments:
    'id-length': ['error', { exceptions: ['_'] }],

    // Disable rules that make it awkward to work with GraphQL (like mutating
    // context object within resolvers, or accessing certain schema props):
    'no-param-reassign': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': [
      'error',
      { allow: ['_queryType', '_mutationType'] },
    ],

    // This is not an issue in this application:
    'import/no-cycle': 'off',

    // Allow TypeScript's triple-slash directives:
    'spaced-comment': ['error', 'always', { markers: ['/'] }],

    // We don't find this confusing in practice.
    'no-confusing-arrow': 'off',

    // Don't warn about using devDependencies in test helpers.
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.test.js', '**/*.spec.js', '**/test-helpers.js'],
      },
    ],
  },
};
