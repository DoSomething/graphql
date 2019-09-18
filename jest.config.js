// For a detailed explanation of each configuration option, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically reset mock instances between each test:
  clearMocks: true,

  // This is a Node.js application:
  testEnvironment: 'node',

  // Don't try to run helpers as tests:
  testMatch: ['**/__tests__/**/*.js', '!**/__tests__/**/helpers.js'],
};
