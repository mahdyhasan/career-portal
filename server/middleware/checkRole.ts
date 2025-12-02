// server/middleware/checkRole.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if the authenticated user has any of the allowed roles
 */
export const checkRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role?.name;
    
    if (!userRole) {
      return res.status(403).json({ 
        message: 'User role not defined',
        code: 'ROLE_NOT_DEFINED'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          required: allowedRoles,
          current: userRole
        }
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is SuperAdmin
 */
export const requireSuperAdmin = checkRole('SuperAdmin');

/**
 * Middleware to check if user is HiringManager or SuperAdmin
 */
export const requireHiringManager = checkRole('HiringManager', 'SuperAdmin');

/**
 * Middleware to check if user is Candidate, HiringManager, or SuperAdmin (authenticated users)
 */
export const requireAuthenticated = checkRole('Candidate', 'HiringManager', 'SuperAdmin');

/**
 * Middleware to check if user owns the resource or is SuperAdmin
 * This is a factory that takes a function to extract the owner ID from the request
 */
export const checkOwnershipOrSuperAdmin = (getOwnerId: (req: AuthRequest) => number | null) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role?.name;
    const userId = req.user.id;
    const ownerId = getOwnerId(req);

    // SuperAdmin can access everything
    if (userRole === 'SuperAdmin') {
      return next();
    }

    // Check if user owns the resource
    if (ownerId && userId === ownerId) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied: You can only access your own resources',
      code: 'INSUFFICIENT_PERMISSIONS',
      details: {
        required: ['SuperAdmin', 'Owner'],
        current: userRole
      }
    });
  };
};

/**
 * Middleware to check if user can manage jobs (HiringManager or SuperAdmin)
 */
export const requireJobManagement = checkRole('HiringManager', 'SuperAdmin');
