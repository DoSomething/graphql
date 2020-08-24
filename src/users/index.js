require('dotenv').config();
require = require('esm')(module);

const { ApolloServer } = require('apollo-server');
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = require('./typeDefs').default;
const resolvers = require('./resolvers').default;
const UsersApi = require('./UsersApi').default;

const port = 3003;

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  dataSources: () => ({
    usersApi: new UsersApi(),
  }),
});

server.listen({ port }).then(({ url }) => {
  console.log(`Users service ready at ${url}`);
});
