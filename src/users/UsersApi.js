import { stringify } from 'qs';
import logger from 'heroku-logger';
import { intersection, snakeCase } from 'lodash';
import { RESTDataSource } from 'apollo-datasource-rest';

import config from '../../config';
import typeDefs from './typeDefs';
import { getOptional } from '../shared/helpers/graphql';

class UserApi extends RESTDataSource {
  constructor() {
    super();

    this.northstarUrl = config('services.northstar.url');
    this.auroraUrl = config('services.aurora.url');
  }

  /**
   * Fetch a user from Northstar by ID.
   *
   * @return {Object}
   */
  async getUserById(id, fields, context) {
    const optionalFields = intersection(fields, getOptional(typeDefs, 'User'));

    // Northstar expects a comma-separated list of snake_case fields.
    // If not querying anything, use 'undefined' to omit query string.
    const include = optionalFields.length
      ? optionalFields.map(snakeCase).join()
      : undefined;

    logger.debug('Loading user from Northstar', { id, include });

    try {
      const url = `${this.northstarUrl}/v2/users/${id}?${stringify({
        include,
      })}`;

      const response = await this.get(url, authorizedRequest(context));

      return transformItem(response);
    } catch (exception) {
      const error = exception.message;

      logger.warn('Unable to load user.', { id, error });
    }

    return null;
  }
}

export default UserApi;
