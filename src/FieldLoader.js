import { set } from 'lodash';
import DataLoader from 'dataloader';

import MagicObject from './utilities/MagicObject';
import { getUserById } from './repositories/northstar';
import { authorizedRequest } from './repositories/helpers';

export default (id, context) => {
  const options = authorizedRequest(context);

  if (!context.userLoader) {
    // Create a loader to batch user requests:
    const loader = new DataLoader(ids =>
      Promise.resolve(
        // eslint-disable-next-line
        ids.map(id => {
          // Create a loader to tally up the fields we try to access
          // off of the magic object this resolver returns:
          const fieldLoader = new DataLoader(async fields => {
            const user = await getUserById(id, fields, options);
            return fields.map(field => user[field]);
          });

          return MagicObject(field => fieldLoader.load(field));
        }),
      ),
    );

    set(context, 'userLoader', loader);
  }

  return context.userLoader.load(id);
};
