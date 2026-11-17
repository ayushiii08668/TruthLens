const crypto = require('crypto');
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'An account with this email address already exists.');
    }

    const user = new User({
      name,
      email,
      passwordHash: password,
      role: role && ['user', 'analyst'].includes(role) ? role : 'user'
    });

    await user.save();

    const token = generateToken({ id: user._id, role: user.role });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    return sendSuccess(res, 201, 'User registered successfully', { user: userResponse, token });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken({ id: user._id, role: user.role });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    return sendSuccess(res, 200, 'Login successful', { user: userResponse, token });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };
    return sendSuccess(res, 200, 'Current user profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * PATCH /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return sendError(res, 400, 'An account with this email address already exists.');
      }
      req.user.email = email;
    }

    if (name) {
      req.user.name = name;
    }

    await req.user.save();

    const userResponse = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      updatedAt: req.user.updatedAt
    };

    return sendSuccess(res, 200, 'Profile updated successfully', { user: userResponse });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Successfully logged out.');
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset token
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 even if user is not found to avoid account enumeration
      return sendSuccess(res, 200, 'If this email is registered, password reset instructions have been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    return sendSuccess(res, 200, 'Password reset token generated successfully', {
      resetToken // In production, sent via email; returned here for client integration & testing
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+passwordHash');

    if (!user) {
      return sendError(res, 400, 'Password reset token is invalid or has expired.');
    }

    user.passwordHash = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    return sendSuccess(res, 200, 'Password reset successfully. You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword
};

