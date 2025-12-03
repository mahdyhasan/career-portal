// server/middleware/security.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import rateLimit from 'express-rate-limit';
// import helmet from 'helmet'; // Commented out due to missing type declarations

// Rate limiting configuration
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different endpoints
export const generalRateLimiter = createRateLimiter();

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth

export const uploadRateLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 uploads per hour

// Strict rate limiter for sensitive operations
export const strictRateLimiter = createRateLimiter(5 * 60 * 1000, 3); // 3 requests per 5 minutes

// Helmet security headers
// export const securityHeaders = helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'"],
//       frameSrc: ["'none'"],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"],
//       formAction: ["'self'"]
//     }
//   },
//   crossOriginEmbedderPolicy: false,
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// });

// Input validation middleware
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
      }
      
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Sanitize input middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove any script tags and basic XSS prevention
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// File upload validation
export const validateFileUpload = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      message: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      message: 'File size too large. Maximum size is 5MB.',
      code: 'FILE_TOO_LARGE'
    });
  }

  // Check filename for malicious characters
  const filename = req.file.originalname;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      message: 'Invalid filename',
      code: 'INVALID_FILENAME'
    });
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// API key validation (for future use)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      message: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }

  // In production, validate against database or environment variable
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP || '')) {
      return res.status(403).json({
        message: 'Access denied from this IP address',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

// Honeypot field for form spam prevention
export const honeypot = (fieldName: string = 'honeypot') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body[fieldName]) {
      // Log potential spam attempt
      console.log(`Honeypot triggered: ${req.ip} - ${req.get('User-Agent')}`);
      
      // Return success to avoid revealing it's a honeypot
      return res.status(200).json({
        message: 'Success',
        code: 'SUCCESS'
      });
    }
    
    next();
  };
};
