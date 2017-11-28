const { NORTHSTAR_URL } = process.env;

export default (req, res, next) => {
  res.locals.config = res.locals.config || {};
  res.locals.config.northstarUrl = NORTHSTAR_URL;

  next();
};
