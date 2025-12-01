// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { User } from '@shared/api';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user?: User;
}

// Authentication middleware
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get user from database
    const user = await AuthService.findUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        code: 'INVALID_TOKEN'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role?.name;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          required: roles,
          current: userRole
        }
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.findUserById(decoded.id);
      
      if (user && user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user for optional auth
    next();
  }
};