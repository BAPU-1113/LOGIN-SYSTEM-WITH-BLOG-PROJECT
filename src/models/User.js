const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user', 'chef'],
        message: '{VALUE} is not a valid role. Allowed roles are: admin, user, chef',
      },
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate crypto token for password reset and save hashed version
userSchema.methods.createPasswordResetToken = function () {
  // Generate random 32-byte hex token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field (SHA-256 for secure storage)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Expiration: 15 minutes from now
  const expiryMinutes = parseInt(process.env.RESET_PASSWORD_EXPIRES_MINUTES || '15', 10);
  this.resetPasswordExpires = Date.now() + expiryMinutes * 60 * 1000;

  // Return unhashed token to be emailed to user
  return resetToken;
};

// Clean object representation to remove sensitive internal fields
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
