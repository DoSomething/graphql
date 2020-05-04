# GraphQL

**This is the DoSomething.org GraphQL API Gateway.**
[GraphQL](http://graphql.org) provides a universal schema for all the data in
the DoSomething.org ecosystem. It allows applications to fetch only the fields
they need & abstracts away service boundaries. Our GraphQL service is powered by
[Apollo Server](https://www.apollographql.com/docs/apollo-server/) and runs on
[Lambda](https://aws.amazon.com/lambda/).

### Getting Started

Ready to dive in to GraphQL? Check out the [offical docs](http://graphql.org) or
["How To GraphQL"](https://www.howtographql.com).

### Contributing

Fork and clone this repository, then follow the setup instructions:

```sh
# Install dependencies:
$ npm install

# Configure environment variables:
$ cp .env.example .env && vi .env

# And finally, start up your server!
$ npm start
```

You're all set to make anonymous GraphQL queries against Northstar or Rogue's development environment. To use a different environment, swap your `QUERY_ENV` environment variable in `.env` to `local`, `qa`, or `production`.

If you're querying Gambit, you'll need to set the `GAMBIT_BASIC_AUTH_USER` or `GAMBIT_BASIC_AUTH_PASS` for each environment. You can find these values in LastPass. If you're querying Contentful, you'll need to fill Gambit or Phoenix's `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN` and `CONTENTFUL_PREVIEW_TOKEN` environment variables (found by visiting the "Settings → API Keys → Local Development" page in [Contentful](https://app.contentful.com)).

#### Authenticated Requests

To run queries or mutations on behalf of a user from your GraphQL Playground, you'll need to set the `Authorization` header. You can do this by copying a valid access token (either from your [Paw](https://paw.cloud), [Postman](https://www.getpostman.com), or `window.AUTH` object in an authenticated page, like your local [`phoenix.test`](http://phoenix.test/us)):

![authorization-header](https://user-images.githubusercontent.com/583202/80999500-caba8b80-8e12-11ea-99fc-0672ece5be95.png)


### Security Vulnerabilities

We take security very seriously. Any vulnerabilities in this service should be
reported to [security@dosomething.org](mailto:security@dosomething.org), and
will be promptly addressed. Thank you for taking the time to responsibly
disclose any issues you find.

### License

&copy; DoSomething.org. Our GraphQL server is free software, and may be
redistributed under the terms specified in the
[LICENSE](https://github.com/DoSomething/graphql/blob/dev/LICENSE) file. The
name and logo for DoSomething.org are trademarks of Do Something, Inc and may
not be used without permission.
