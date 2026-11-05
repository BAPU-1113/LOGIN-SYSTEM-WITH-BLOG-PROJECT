const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Helper to sign JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'dish_booking_jwt_secret_token_secure_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @desc    Sign up new user
 * @route   POST /api/auth/signup (or /api/auth/register)
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Create user (defaults to 'user' role if not specified)
    const user = await User.create({
      name: name ? name.trim() : email.split('@')[0],
      email: email.toLowerCase().trim(),
      password,
      role: role && ['admin', 'chef', 'user'].includes(role) ? role : 'user',
      phone: phone || '',
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password match using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Password Reset Link via Email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Security best practice: don't leak user existence, but respond with friendly status
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    // Get reset token and save hashed version to user
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email via Nodemailer
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email successfully',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined, // For easy student/AI agent verification
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using token
 * @route   POST /api/auth/reset-password/:token (or POST /api/auth/reset-password with token in body)
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password is required and must be at least 6 characters long',
      });
    }

    // Hash the token provided in request to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token and unexpired timestamp
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log the user in directly with a fresh token
    const jwtToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You are now logged in.',
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
