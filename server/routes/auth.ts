// server/routes/auth.ts
import { RequestHandler } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { LoginRequest, SignupRequest } from '@shared/api';
import nodemailer from 'nodemailer';

// Login endpoint
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const loginData: LoginRequest = req.body;
    
    if (!loginData.email || !loginData.password) {
      return res.status(400).json({
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await AuthService.loginUser(loginData);
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
};

// Signup endpoint
export const handleSignup: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR'
      });
    }

    // Default role to Candidate for public signup
    const signupData: SignupRequest = {
      email,
      password,
      role: 'Candidate',
      firstName,
      lastName
    };

    const result = await AuthService.registerUser(signupData);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Signup failed',
      code: 'SIGNUP_FAILED'
    });
  }
};

// Social login endpoint
export const handleSocialLogin: RequestHandler = async (req, res) => {
  try {
    const { provider, token } = req.body;
    
    if (!provider || !token) {
      return res.status(400).json({
        message: 'Provider and token are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Placeholder for social login implementation
    res.status(501).json({
      message: 'Social login not yet implemented',
      code: 'NOT_IMPLEMENTED'
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      message: 'Social login failed',
      code: 'SOCIAL_LOGIN_FAILED'
    });
  }
};

// Token validation endpoint
export const handleValidateToken: RequestHandler = async (req: AuthRequest, res) => {
  try {
    // The authenticateToken middleware already validated the token
    const user = req.user;
    if (!user) {
      return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
    
    // Fetch fresh user data
    const freshUser = await AuthService.findUserById(user.id);
    if (!freshUser) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }
    
    res.json({ 
      valid: true, 
      user: freshUser 
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ valid: false, message: 'Token validation failed' });
  }
};

// Token refresh endpoint
export const handleRefreshToken: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Generate new token
    const newToken = AuthService.generateToken(user);
    
    res.json({
      token: newToken,
      user: user
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Token refresh failed',
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
};

// Send OTP endpoint
export const handleSendOTP: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await AuthService.sendOTP(email);
    
    res.json(result);
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to send OTP',
      code: 'OTP_SEND_FAILED'
    });
  }
};

// Verify OTP endpoint
export const handleVerifyOTP: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await AuthService.verifyOTP(email, otp);
    
    res.json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Invalid OTP',
      code: 'OTP_VERIFY_FAILED'
    });
  }
};

// Signup with OTP verification endpoint
export const handleSignupWithOTP: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName, otp } = req.body;
    
    if (!email || !password || !firstName || !lastName || !otp) {
      return res.status(400).json({
        message: 'All fields are required including OTP',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify OTP first
    await AuthService.verifyOTP(email, otp);
    
    // Proceed with signup
    const signupData: SignupRequest = {
      email,
      password,
      role: 'Candidate',
      firstName,
      lastName
    };

    const result = await AuthService.registerUser(signupData);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Signup with OTP error:', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Signup failed',
      code: 'SIGNUP_FAILED'
    });
  }
};

// Logout endpoint
export const handleLogout: RequestHandler = async (req: AuthRequest, res) => {
  try {
    // In a proper implementation, you might:
    // 1. Blacklist the token in a database
    // 2. Clear session data
    // 3. Log the logout event
    
    const user = req.user;
    if (user) {
      console.log(`User ${user.email} logged out`);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};