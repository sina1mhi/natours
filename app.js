const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const rateLimiter = require('./utils/rateLimiter');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// MIDDLEWARES
// -- SET SECURITY HEADERS
app.use(helmet());

// -- SET RATE LIMITATION
app.use('/api', rateLimiter);

// -- LOG REQUEST DETAILS IN DEVELOPMENT ENVIRONMENT
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// -- PARSE THE BODY OF REQUEST INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));

// -- DATA SANITIZE AGAINST "NOSQL QUERY INJECTION"
app.use(mongoSanitize());

// -- DATA SANITIZE AGAINST "XSS ATTACKS"
app.use(xss());

// -- PREVENT PARAMETER POLLUTION
app.use(hpp({ whitelist: ['duration'] }));

// -- HANDLE THE STATIC FILES
app.use(express.static(`${__dirname}/public`));

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
});

// GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
