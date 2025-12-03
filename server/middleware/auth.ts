import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService';
import { User, Role } from '@shared/api';

// Extend Express Request type to include user information
export interface AuthRequest extends Request {
  file: any;
  user?: User & {
    role: Role;
  };
}

// Middleware to authenticate JWT token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // Fetch fresh user data
    const user = await AuthService.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'Invalid token - user not found',
        code: 'TOKEN_INVALID'
      });
    }

    // Ensure user has role
    if (!user.role) {
      return res.status(401).json({
        message: 'User role not found',
        code: 'ROLE_NOT_FOUND'
      });
    }

    req.user = user as User & { role: Role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await AuthService.findUserById(decoded.userId);
      if (user && user.role) {
        req.user = user as User & { role: Role };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors, just continue without user
    next();
  }
};

// Middleware to require specific role
export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role.name !== requiredRole) {
      return res.status(403).json({
        message: `Access denied. ${requiredRole} role required.`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Middleware to require any of multiple roles
export const requireAnyRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        message: `Access denied. One of these roles required: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};
