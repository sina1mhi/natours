const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// SIGN (CREATE) JWT INTERNAL FUNCTION
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// CREATE AND SEND JWT FUNCTION
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // REMOVE PASSWORD FIELD FROM RESPONSE
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  // const token = signToken(user._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: { user },
  // });
  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // IF THE EMAIL AND PASSWORD FIELDS EXIST
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Provide the email and password fields', 400);

  // IF THE EMAIL AND PASSWORD FIELDS ARE VALID
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isPasswordCorrect(password, user.password)))
    throw new AppError('Email or password is incorrect', 401);

  // CREATE AND SEND TOKEN TO THE CLIENT
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // IF TOKEN EXISTS
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  if (!token) throw new AppError(`You're not logged in, login to get access.`, 401);

  // IF TOKEN IS VALID
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // IF THE USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) throw new AppError('The owner of this token does not exist', 401);

  // IF USER'S PASSWORD HAS CHANGED AFTER TOKEN ISSUE TIME
  const passwordChangeStatus = currentUser.isPasswordChanged(decoded.iat);
  if (passwordChangeStatus) throw new AppError(`User's password is changed, login again`, 401);

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this operation', 403));

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // IF THE USER WITH THE GIVEN EMAIL EXISTS
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError('You would recieve an email if there is an account with this email', 404);

  // RESET TOKEN CREATION
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // SEND TOKEN TO THE CLIENT VIA EMAIL
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Use the following URL to reset your password:\n${resetURL}\nIf you didn't ask for reset link, you can ignore this email.`;

  try {
    await sendEmail({
      email: 'customer@gmail.com',
      subject: 'Reset password link - valid for 10 minutes',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Reset password URL was sent to your email address',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError('The operation of sending reset password link was failed', 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // GET THE USER BY THE GIVEN TOKEN
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  // IF THE USER EXISTS -> CHNAGE THE PASSWORD RELATED FIELDS
  if (!user) throw new AppError('Token is either invalid or expired', 400);

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // CREATE A TOKEN AND SEND TO THE CLIENT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // GET THE USER
  const user = await User.findById(req.user._id).select('+password');

  // CHECK IF THE GIVEN PASSWORD (CURRENT PASSWORD) IS CORRECT
  if (!(await user.isPasswordCorrect(req.body.currentPassword, user.password)))
    throw new AppError('The password is incorrect, operation failed', 401);

  // CHANGE THE USER'S PASSWORD
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  // SIGN THE JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'The Password has changed successfully',
  });
});
