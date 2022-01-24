const rateLimit = require('express-rate-limit');
const AppError = require('./appError');

module.exports = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Maximum attempts has reached, Try again in an hour',
  handler: function (req, res, next, options) {
    next(new AppError(options.message, 400));
  },
});
