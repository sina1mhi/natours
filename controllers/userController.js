const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// FILTER FUNCTION > REQ OBJECT TO A NEW ALLOWED OBJECT
const filterObject = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) filteredObj[field] = obj[field];
  });
  return filteredObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // IF THE PASSWORD FIELD EXISTS -> SEND ERROR
  if (req.body.password || req.body.confirmPassword)
    throw new AppError('Do not send password related fields to this route', 400);

  // CHANGE THE USER DATA
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObject(req.body, 'name', 'email'), {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // UPDATE THE USER'S ACTIVE FILED
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not been configured yet',
  });
};
