const AppError = require('../utils/appError');

// CAST ERROR HANDLER
const handleCastErrorDB = (err) => {
  const message = `${err.value} is not a valid data for ${err.path}`;
  return new AppError(message, 400);
};

// DUPLICATE FIELD VALUE HANDLER
const handleDuplicateFieldsDB = (err) => {
  const message = `Invalid Value \"${err.keyValue.name}" has entered`;
  console.log(err.keyValue);
  return new AppError(message, 400);
};

// VALIDATION ERROR HANDLER
const handleValidationErrorDB = (err) => {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  return new AppError(message, 400);
};

// JWT ERROR HANDLER
const handleJWTError = () => new AppError('Token is not valid, Login again', 401);

// JWT EXPIRATION HANDLER
const handleJWTExpireError = () => new AppError('Token is expired, login again', 401);

// RUNS IN "DEVELOPMENT ENVIRONMENT"
const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// RUNS IN "PRODUCTION ENVIRONMENT"
const sendErrProd = (err, res) => {
  // OPERATIONAL ERRORS - TRUSTED
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // PROGRAMMING ERROR - UNKNOWN
    // 1) LOG THE ERROR
    console.error(`ERROR: ${err}`);

    // 2) SEND A GENERIC RESPONSE
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

// GLOBAL ERROR HANDLER
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') sendErrDev(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error;
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrProd(error ? error : err, res);
  }

  next();
};
