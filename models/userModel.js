const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// USER SCHEMA DEFINITION
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: [true, 'An email must be unique'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'The entered email is not valid'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Role is not valid',
    },
    default: 'user',
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: [8, 'Password must contain 8 characters atleast'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Password confirmation was not done'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'The entered passwords do not match',
    },
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// PASSWORD ENCRYPTION DOCUMENT MIDDLEWARE
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

// ACTIVE USERS SELECTION QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// PASSWORD COMPARE INSTANCE METHOD
userSchema.methods.isPasswordCorrect = async function (candidatePassword, userPassword) {
  return bcrypt.compare(candidatePassword, userPassword);
};

// PASSWORD CHNANGE CHECKER (AFTER TOKEN ISSUE TIME)
userSchema.methods.isPasswordChanged = function (tokenIssueTime) {
  if (this.passwordChangeAt) return Number(this.passwordChangeAt.getTime() / 1000) > tokenIssueTime;
  return false;
};

// RESET PASSWORD TOKEN CREATION
userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // M * S * MS

  return resetToken;
};

// USER MODEL DEFINITION
const User = mongoose.model('User', userSchema);

module.exports = User;
