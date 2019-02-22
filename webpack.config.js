const configure = require('@dosomething/webpack-config');
const path = require('path');

// Configure Webpack using `@dosomething/webpack-config`.
module.exports = configure({
  entry: {
    app: ['babel-polyfill', './src/playground.js'],
  },
  output: {
    // Override output path for Laravel's "public" directory.
    filename: '[name].js',
    path: path.join(__dirname, '/dist/'),
    publicPath: '/dist/',
  },
});
