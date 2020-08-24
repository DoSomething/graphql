// Compile ES module syntax on-demand, install 'fetch'
// polyfill, & load environment variables from '.env'.
require('dotenv').config();
require = require('esm')(module);

const chalk = require('chalk');
const boxen = require('boxen');
const { ApolloServer } = require('apollo-server');
const { ApolloGateway } = require('@apollo/gateway');

const port = 3000;

const gateway = new ApolloGateway({
  serviceList: [
    // { name: 'activity', url: 'http://localhost:3001' },
    // { name: 'campaigns', url: 'http://localhost:3002' },
    { name: 'users', url: 'http://localhost:3003' },
  ],
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
});

server.listen({ port }).then(({ url }) => {
  console.log(`Gateway server ready at ${url}`);
});
