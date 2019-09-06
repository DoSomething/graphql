import { get, isUndefined, zipObject } from 'lodash';
import DataLoader from 'dataloader';

class FieldDataLoader {
  constructor(batchFunction, options = {}) {
    // Configure our nested loaders (woah) for this type of item. Optionally,
    // configure batch/caching settings for the item loader:
    this.loader = new DataLoader(
      async ids =>
        ids.map(
          id =>
            new DataLoader(async fields => {
              // We'll call `batchFunction` once per unique ID, with all the unique
              // fields we've requested for that ID within this request:
              const result = await batchFunction(id, fields);

              // DataLoader requires the same signature for the batched input & ouput,
              // but we might have a scenario where the given ID isn't found. To handle
              // that, we'll return an appropriately sized array of 'undefined' values
              // here & then zip it back up in our 'load' function below:
              if (!result) {
                return fields.map(() => undefined);
              }

              // Otherwise, we'll return an array of values corresponding to the requested
              // fields. If the item exists, but a field doesn't, we'll return `null`.
              return fields.map(field => get(result, field, null));
            }),
        ),
      options,
    );
  }

  load(key, fields) {
    return this.loader
      .load(key)
      .then(item => item.loadMany(fields))
      .then(values => {
        // If this resource 404'd, return `null` (see above).
        if (values.every(isUndefined)) {
          return null;
        }

        // Otherwise, zip the loaded fields back into an object:
        return zipObject(fields, values);
      });
  }

  loadMany() {
    // @TODO: Eventually, we should support the same API as DataLoader!
    throw new Error('Not supported.');
  }

  clear() {
    // @TODO: Eventually, we should support the same API as DataLoader!
    throw new Error('Not yet implemented.');
  }

  clearAll() {
    // @TODO: Eventually, we should support the same API as DataLoader!
    throw new Error('Not yet implemented.');
  }

  prime() {
    // @TODO: Eventually, we should support the same API as DataLoader!
    throw new Error('Not yet implemented.');
  }
}

export default FieldDataLoader;
