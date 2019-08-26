const MagicObject = accessor => {
  const get = (target, field) => {
    // Some code may try to test if this is a promise, so
    // we'll want to make sure to tell them we're not!
    if (field === 'then') {
      return undefined;
    }

    return accessor(field);
  };

  return new Proxy({}, { get });
};

export default MagicObject;
