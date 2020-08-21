import { getSchoolById, searchSchools } from '../repositories/schools';

/**
 * GraphQL resolvers.
 *
 * @var {Object}
 */
const resolvers = {
  Query: {
    school: (_, args) => getSchoolById(args.id),
    searchSchools: (_, args) => searchSchools(args),
  },
};

export default resolvers;
