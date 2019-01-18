import config from '../../config';

export default (req, res, next) => {
  res.locals.config = res.locals.config || {};

  const environment = config('app.env');
  res.locals.config.environment = environment;
  res.locals.config.production = environment === 'production';
  res.locals.config.environmentName = config('services.displayName');
  res.locals.config.northstarUrl = config('services.northstar.url');

  res.locals.config.url = `${config('app.url')}/graphql`;

  next();
};
