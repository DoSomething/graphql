import { createClient } from 'contentful';
import { assign, map } from 'lodash';
import logger from 'heroku-logger';

import config from '../../../config';
import Loader from '../../loader';
import Cache, { ONE_MONTH } from '../../cache';

const cache = new Cache('contentful', { expiresIn: ONE_MONTH });

const spaceId = config('services.contentful.gambit.spaceId');

const contentfulClient = createClient({
  space: spaceId,
  accessToken: config('services.contentful.gambit.accessToken'),
  resolveLinks: false,
});

/**
 * @param {Object} json
 * @return {Number}
 */
const getActionId = json => json.fields.actionId;

/**
 * @param {Object} json
 * @return {String}
 */
const getContentType = json => json.sys.contentType.sys.id;

/**
 * @param {Object} json
 * @return {String}
 */
const getMessageText = json => {
  if (json && json.fields) {
    return json.fields.text;
  }
  return null;
};

/**
 * @param {Object} json
 * @return {Object}
 */
const getSummary = json => ({
  id: json.sys.id,
  contentType: getContentType(json),
  createdAt: json.sys.createdAt,
  updatedAt: json.sys.updatedAt,
  name: json.fields.name,
});

/**
 * Reference fields are Link objects with the Entry Id which we will use to resolve later.
 * @param {Object} json
 * @return {Object}
 */
const getFields = json => {
  const contentType = getContentType(json);
  const fields = json.fields;
  const attachments = fields.attachments || [];

  // TODO: determine how to get the actionId for this broadcast since the choices
  // can point to different campaigns through their action ids.
  if (contentType === 'askMultipleChoice') {
    return {
      attachments,
      invalidAskMultipleChoiceResponse: fields.invalidAskMultipleChoiceResponse,
      text: getMessageText(json),
      // Links
      saidFirstChoiceTransition: fields.firstChoiceTransition,
      saidSecondChoiceTransition: fields.secondChoiceTransition,
      saidThirdChoiceTransition: fields.thirdChoiceTransition,
      saidFourthChoiceTransition: fields.fourthChoiceTransition,
      saidFifthChoiceTransition: fields.fifthChoiceTransition,
    };
  }
  if (contentType === 'askSubscriptionStatus') {
    return {
      attachments,
      invalidAskSubscriptionStatusResponse:
        fields.invalidAskSubscriptionStatusResponse,
      saidNeedMoreInfo: fields.needMoreInfo,
      text: getMessageText(json),
      // Links ---
      saidActiveTransition: fields.activeTransition,
      saidLessTransition: fields.lessTransition,
    };
  }
  if (contentType === 'askVotingPlanStatus') {
    return {
      attachments,
      text: getMessageText(json),
      // Links ---
      saidCantVoteTransition: fields.cantVoteTransition,
      saidNotVotingTransition: fields.notVotingTransition,
      saidVotedTransition: fields.votedTransition,
    };
  }
  if (contentType === 'askYesNo') {
    return {
      attachments,
      invalidAskYesNoResponse: fields.invalidAskYesNoResponse,
      text: getMessageText(json),
      // Start Links ---
      saidNoTransition: fields.noTransition,
      saidYesTransition: fields.yesTransition,
    };
  }
  if (contentType === 'autoReply') {
    return {
      autoReply: fields.autoReply,
      // Links ---
      legacyCampaign: fields.campaign,
    };
  }
  if (contentType === 'autoReplyBroadcast') {
    return {
      attachments,
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  if (contentType === 'autoReplyTransition') {
    return {
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  if (contentType === 'campaign') {
    return {
      campaignId: fields.campaignId,
    };
  }
  // TODO: If the response is an askMultipleChoice we should inject the broadcast itself as a topic
  // otherwise, the response's topic.
  if (contentType === 'defaultTopicTrigger') {
    return {
      trigger: fields.trigger,
      // Links --
      response: fields.response,
    };
  }
  if (contentType === 'faqAnswer') {
    return {
      text: getMessageText(json),
    };
  }
  if (contentType === 'photoPostBroadcast') {
    return {
      attachments,
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  if (contentType === 'photoPostConfig') {
    return {
      actionId: getActionId(json),
      askPhoto: fields.askPhotoMessage,
      askQuantity: fields.askQuantityMessage,
      askWhyParticipated: fields.askWhyParticipatedMessage,
      completedPhotoPost: fields.completedMenuMessage,
      completedPhotoPostAutoReply: fields.invalidCompletedMenuCommandMessage,
      invalidQuantity: fields.invalidQuantityMessage,
      invalidPhoto: fields.invalidPhotoMessage,
      invalidWhyParticipated: fields.invalidWhyParticipatedMessage,
      startPhotoPostAutoReply: fields.invalidSignupMenuCommandMessage,
      // Links ---
      legacyCampaign: fields.campaign,
    };
  }
  if (contentType === 'photoPostTransition') {
    return {
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  if (contentType === 'textPostBroadcast') {
    return {
      attachments,
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  if (contentType === 'textPostConfig') {
    return {
      actionId: getActionId(json),
      completedTextPost: fields.completedTextPostMessage,
      invalidText: fields.invalidTextMessage,
      legacyCampaign: fields.campaign,
    };
  }
  if (contentType === 'textPostTransition') {
    return {
      text: getMessageText(json),
      // Links ---
      topic: fields.topic,
    };
  }
  return null;
};

/**
 * @param {Object} json
 * @return {Object}
 */
const transformItem = json => assign(getSummary(json), getFields(json));

/**
 * @param {Object} json
 * @return {Object}
 */
const transformAsset = json => ({
  id: json.sys.id,
  url: json.fields.file.url,
  contentType: json.fields.file.contentType,
});

/**
 * Fetch a Gambit Contentful entry by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getGambitContentfulEntryById = async (id, context) => {
  logger.debug('Loading Gambit Contentful entry', { id });

  return cache.remember(`Entry:${spaceId}:${id}`, async () => {
    try {
      const json = await contentfulClient.getEntry(id);
      return transformItem(json);
    } catch (exception) {
      logger.warn('Unable to load Gambit Contentful entry.', {
        id,
        error: exception.message,
        context,
      });
    }
    return null;
  });
};

/**
 * Fetch a Gambit Contentful asset by ID.
 *
 * @param {String} id
 * @return {Object}
 */
export const getGambitContentfulAssetById = async (id, context) => {
  logger.debug('Loading Gambit Contentful asset', { id });

  return cache.remember(`Asset:${spaceId}:${id}`, async () => {
    try {
      const json = await contentfulClient.getAsset(id);
      return transformAsset(json);
    } catch (exception) {
      logger.warn('Unable to load Gambit Contentful asset.', {
        id,
        error: exception.message,
        context,
      });
    }
    return null;
  });
};

/**
 * Fetch all conversation triggers from the Gambit Contentful space.
 *
 * @return {Array}
 */
export const getConversationTriggers = async () => {
  const query = {
    // TODO: Allow customizable ordering
    order: '-sys.createdAt',
    // TODO: Allow pagination instead of sending a high arbitrary limit
    limit: 250,
    content_type: 'defaultTopicTrigger',
  };

  logger.debug('Loading Gambit Conversation Triggers', { query });

  try {
    const json = await contentfulClient.getEntries(query);
    return map(json.items, transformItem);
  } catch (exception) {
    logger.warn('Unable to load Gambit Conversation Triggers.', {
      query,
      error: exception.message,
    });
  }
  return [];
};

/**
 * Fetch a Gambit Contentful entry by "link".
 *
 * @param {Object} link
 * @param {Object} context
 */
export const getContentfulItemByLink = async (link, context) => {
  if (!link) {
    return null;
  }

  const { linkType, id } = link.sys;

  switch (linkType) {
    case 'Asset':
      return Loader(context).gambitAssets.load(id);
    case 'Entry':
      return Loader(context).topics.load(id);
    default:
      throw new Error('Unsupported link type.');
  }
};

/**
 * GraphQL resolver for Contentful links.
 *
 * @param {Object} entry
 * @param {Object} context
 * @param {Object} info
 */
export const linkResolver = (entry, args, context, info) => {
  const { fieldName, parentType } = info;
  const link = entry[fieldName];

  logger.debug(`Resolving link(s) on ${parentType.name}.${fieldName}`);

  if (Array.isArray(link)) {
    return link.map(asset => getContentfulItemByLink(asset, context));
  }

  return getContentfulItemByLink(link, context);
};

export default null;
