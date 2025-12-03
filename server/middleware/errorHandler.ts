// server/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: (req as any).user?.id,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (error.message && error.message.includes('Cast to ObjectId failed')) {
    const message = 'Resource not found';
    error = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (error.message && error.message.includes('E11000')) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (error.message && error.message.includes('Validation failed')) {
    const message = 'Invalid input data';
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (error.message && error.message.includes('jwt')) {
    const message = 'Invalid token. Please log in again';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  // File upload errors
  if (error.message && error.message.includes('Multer')) {
    const message = 'File upload failed';
    error = new AppError(message, 400, 'FILE_UPLOAD_ERROR');
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server`, 404, 'NOT_FOUND');
  next(error);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Timeout middleware
export const timeoutHandler = (seconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.setTimeout(seconds * 1000, () => {
      const error = new AppError('Request timeout', 408, 'TIMEOUT');
      next(error);
    });
    next();
  };
};
