class FieldMap {
  constructor() {
    // Note: We don't support instantiating the map with a list of
    // key-value pairs because that isn't used by DataLoader.
    this.clear();
  }

  get({ id, fields }) {
    const item = this.ids.get(id);

    if (!item) {
      return null;
    }

    // If we haven't made a request for these fields yet,
    // then we can't use the previously cached promise:
    if (!fields.every(field => item.fields.has(field))) {
      return null;
    }

    return item.promise;
  }

  set({ id, fields }, promise) {
    let item = this.ids.get(id);

    if (!item) {
      item = this.ids.set(id, { fields: new Set(), promise: null });
    }

    // Add any new fields we're requesting to the set:
    fields.forEach(field => item.fields.add(field));
    item.promise = promise;
  }

  delete({ id }) {
    this.ids.clear(id);
  }

  clear() {
    this.ids = new Map();
  }
}

export default FieldMap;
