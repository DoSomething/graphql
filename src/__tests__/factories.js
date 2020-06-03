import Chance from 'chance';
import { ObjectID } from 'bson';
import { factory, ObjectAdapter } from 'factory-bot';

const chance = new Chance();

factory.setAdapter(new ObjectAdapter());

// A user from Northstar. <https://git.io/fxcBG>
factory.define('user', Object, {
  id: () => new ObjectID().toString(),
  first_name: () => chance.first(),
  last_initial: () => chance.letter({ casing: 'upper' }),
  last_name: () => chance.last(),
  birthdate: () => chance.birthday({ string: true }),
  role: 'user',
  updated_at: () => chance.date().toISOString(),
  created_at: () => chance.date().toISOString(),
});

// A group from Rogue.
factory.define('group', Object, {
  id: chance.integer({ min: 1, max: 10000 }),
  group_type_id: chance.integer({ min: 1, max: 10000 }),
  name: () => chance.company(),
  goal: chance.integer({ min: 1, max: 10000 }),
  updated_at: () => chance.date().toISOString(),
  created_at: () => chance.date().toISOString(),
});

// A group type from Rogue.
factory.define('group-type', Object, {
  id: chance.integer({ min: 1, max: 10000 }),
  name: () => chance.company(),
  updated_at: () => chance.date().toISOString(),
  created_at: () => chance.date().toISOString(),
});

// A post from Rogue. <https://git.io/Je3IA>
factory.define('post', Object, {
  id: chance.integer({ min: 1, max: 10000 }),
  type: 'photo',
  text: () => chance.sentence(),
  northstar_id: () => new ObjectID().toString(),
  action_details: {
    data: {
      id: () => chance.integer({ min: 1, max: 4000 }),
      noun: 'Things',
      verb: 'Done',
    },
  },
  // and so on...
});

/**
 * A simple 'factory' helper, styled after Laravel's.
 */
export default (name, ...args) => {
  if (args.length === 1 && typeof args[0] === 'object') {
    // e.g. factory('name', { ...overrides })
    return factory.create(name, args[0]);
  } else if (args.length === 1 && typeof args[0] === 'number') {
    // e.g. factory('name', 3)
    return factory.createMany(name, args[0]);
  } else if (args.length === 2) {
    // e.g. factory('name', 3, { ...overrides })
    return factory.createMany(name, args[0], args[1]);
  }

  return factory.create(name);
};
