# Glossary

## AST

Abstract Syntax Tree (AST)

## Cursor

## Edges

## Fields

## Fragment

## Node

## Resolver

## Root Types

There are three main root types that define the entry points for your GraphQL API:

- `Query`‌
- `Mutation`
- `Subscription`

## Schema

The schema essentially defines the API for your GraphQL server.

## SDL

The Schema Definition Language (SDL) is GraphQL's own type language that is used for writing GraphQL schemas. The SDL is used to define the structure of object types in the schema, which are basically resource entities available to fetch from your API and exposed by GraphQL.

## Types

The examples below are abbreviated types (for brevity) from DoSomething's code. They are specified using SDL, and define the structure of both the campaign model and post model in the application:

```gql
"A campaign."
type Campaign {
  id: Int!
  internalTitle: String!
  isOpen: Boolean!
  pendingCount: Int
  acceptedCount: Int
}

"A user's post on a campaign."
type Post {
  id: Int!
  type: String!
  userId: String
  campaignId: String
  signupId: String!
  quantity: Int
  reacted: Boolean
}
```

While many types in the app can be associated directly to a database model in the application, this is not a requirement when defining types in the schema.
