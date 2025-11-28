import { RequestHandler } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { LoginRequest, SignupRequest } from '@shared/api';

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
    const signupData: SignupRequest = req.body;
    
    if (!signupData.email || !signupData.password || !signupData.role) {
      return res.status(400).json({
        message: 'Email, password, and role are required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (signupData.password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR'
      });
    }

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
        role: req.user.role?.name
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
