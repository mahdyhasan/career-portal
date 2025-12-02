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

    // HARD-CODE ROLE TO CANDIDATE - SECURITY FIX
    const signupData: SignupRequest = {
      email,
      password,
      role: 'Candidate', // Always set to Candidate
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
    const { provider, token, profile } = req.body;
    
    if (!provider || !token) {
      return res.status(400).json({
        message: 'Provider and token are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (provider !== 'google' && provider !== 'linkedin') {
      return res.status(400).json({
        message: 'Invalid provider',
        code: 'VALIDATION_ERROR'
      });
    }

    // For now, we'll just extract email from the token
    // In production, you'd verify the token with the provider
    const email = 'user@example.com'; // This should come from verified token
    
    const result = await AuthService.socialLogin(
      email,
      provider,
      token,
      profile
    );
    
    res.json(result);
  } catch (error) {
    console.error('Social login error:', error);
    res.status(401).json({
      message: error instanceof Error ? error.message : 'Social login failed',
      code: 'SOCIAL_LOGIN_FAILED'
    });
  }
};

// Validate token endpoint
export const handleValidateToken: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({
      message: 'Token validation failed',
      code: 'VALIDATION_FAILED'
    });
  }
};

// Refresh token endpoint
export const handleRefreshToken: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    // Generate new token
    const newToken = AuthService.generateToken(req.user);
    
    res.json({
      token: newToken,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role?.name
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      message: 'Token refresh failed',
      code: 'REFRESH_FAILED'
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
    res.status(400).json({
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
