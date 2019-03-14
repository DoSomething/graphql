import { gql } from 'apollo-server';
import { GraphQLAbsoluteUrl } from 'graphql-url';
import { makeExecutableSchema } from 'graphql-tools';

import Loader from '../loader';
import { stringToEnum } from './helpers';

/**
 * GraphQL types.
 *
 * @var {String}
 */
const typeDefs = gql`
  scalar AbsoluteUrl

  enum EmbedType {
    "This type is used for representing static photos."
    PHOTO
    "This type is used for representing playable videos."
    VIDEO
    "Responses of this type allow a provider to return any generic embed data, without providing either the url or html parameters."
    LINK
    "This type is used for rich HTML content that does not fall under one of the other categories."
    RICH
  }

  # See OEmbed spec, Section 2.3.4 <https://goo.gl/jiEFsd>
  "Embedded metadata for a given URL."
  type Embed {
    "The resource type."
    type: EmbedType!
    "A text title, describing the resource."
    title: String
    "The name of the author/owner of the resource."
    authorName: String
    "The metatag description for a link."
    description: String
    "A URL for the author/owner of the resource."
    authorUrl: AbsoluteUrl
    "The name of the resource provider."
    providerName: String
    "The URL of the resource provider."
    providerUrl: AbsoluteUrl
    "A URL to a thumbnail image representing the resource."
    thumbnailUrl: AbsoluteUrl
    "The width of the optional thumbnail."
    thumbnailWidth: Int
    "The height of the optional thumbnail."
    thumbnailHeight: Int
    "For photo embeds, the source URL of the image."
    url: AbsoluteUrl
    "The width in pixels of the video, image, or rich embed."
    height: Int
    "The height in pixels of the video, image, or rich embed."
    width: Int
    "The HTML required to display the resource. Provided for video or rich embeds. Consumers may wish to load the HTML in an off-domain iframe to avoid XSS vulnerabilities."
    html: String
  }

  type Query {
    embed(url: AbsoluteUrl!): Embed
  }
`;

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  AbsoluteUrl: GraphQLAbsoluteUrl,
  Embed: {
    type: embed => stringToEnum(embed.type),
  },
  Query: {
    embed: (_, args, context) => Loader(context).embeds.load(args.url),
  },
};

/**
 * The generated schema.
 *
 * @var {GraphQLSchema}
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
});
