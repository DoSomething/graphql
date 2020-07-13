# Easily query any DoSomething.org service.

__Get *exactly* what you need from *any* DoSomething.org service, efficiently.__ [GraphQL](http://graphql.org) provides a universal schema for all the data in the DoSomething.org ecosystem. It allows applications to fetch only the fields they need & abstracts away service boundaries.

![big-picture diagram](https://user-images.githubusercontent.com/583202/33576357-7bca1674-d90d-11e7-946d-83928f4807d6.png)

At the moment, you can make requests to [Northstar](https://github.com/dosomething/northstar), our user API, and [Rogue](https://github.com/dosomething/rogue), our activity API. If a [Northstar access token](https://github.com/DoSomething/northstar/blob/dev/documentation/authentication.md) is provided in the `Authorization` header, it will be forwarded along to downstream requests.

## Getting Started
Ready to dive in to GraphQL? Check out the [offical docs](http://graphql.org) or ["How To GraphQL"](https://www.howtographql.com).

## Why GraphQL?
### Caching & Efficiency ⚡️
The GraphQL server will figure out the most efficent way to resolve your query by caching resources & [batching requests](https://github.com/facebook/dataloader) to the underlying APIs.

### Discoverability 🔭
Easily explore & inspect queries using [GraphiQL](/explore)'s autocomplete & documentation sidebar, or using [introspection queries](http://graphql.org/learn/introspection/) to ask for more details programmatically.

### Separation of Concerns 🗺
__Coming Soon:__ With [schema stiching](https://www.apollographql.com/docs/graphql-tools/schema-stitching.html), each individual API is the "source of truth" for it's own schema & the GraphQL gateway is just responsible for stitching things together (for example, linking users in Northstar to signups in Rogue).
