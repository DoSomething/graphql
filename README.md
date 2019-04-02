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
