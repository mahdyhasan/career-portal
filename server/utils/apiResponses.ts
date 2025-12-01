export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_REQUIRED]: 'Authentication required',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.DUPLICATE_RESOURCE]: 'Resource already exists',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error'
} as const;

export const successResponse = (
  res: any,
  status: number,
  message: string,
  data?: any
) => {
  const response: any = {
    success: true,
    message,
    ...(data !== undefined && { data })
  };
  
  return res.status(status).json(response);
};

export const errorResponse = (
  res: any,
  status: number,
  message: string,
  errors?: any
) => {
  const response: any = {
    success: false,
    message,
    ...(errors !== undefined && { errors })
  };
  
  return res.status(status).json(response);
};

export const authErrorResponse = (
  res: any,
  message: string
) => {
  return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, message);
};

export const authorizationErrorResponse = (
  res: any,
  message: string,
  requiredRoles?: string[]
) => {
  const response = {
    success: false,
    message,
    ...(requiredRoles && { requiredRoles })
  };
  
  return res.status(HTTP_STATUS.FORBIDDEN).json(response);
};

export const notFoundResponse = (
  res: any,
  message: string,
  resource?: string
) => {
  const response = {
    success: false,
    message,
    ...(resource && { resource })
  };
  
  return res.status(HTTP_STATUS.NOT_FOUND).json(response);
};
