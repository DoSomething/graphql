const { APP_ENV, NORTHSTAR_URL } = process.env;

export default (req, res, next) => {
  res.locals.config = res.locals.config || {};

  res.locals.config.production = APP_ENV === 'production';
  res.locals.config.environment = APP_ENV;
  res.locals.config.northstarUrl = NORTHSTAR_URL;

  next();
};
