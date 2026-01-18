/**
 * Error Handler Middleware
 * Centralized error handling with Arabic localization for UAE Work Hub
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Error types for UAE Work Hub
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UAE_PASS = 'UAE_PASS_ERROR',
  CULTURAL = 'CULTURAL_ERROR',
  COMPLIANCE = 'COMPLIANCE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

// UAE Work Hub specific error class
export class UAEWorkHubError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly messageAr: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    message: string,
    messageAr: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.messageAr = messageAr;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.name = 'UAEWorkHubError';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error messages in English and Arabic
const ERROR_MESSAGES = {
  [ErrorType.VALIDATION]: {
    en: 'Validation failed',
    ar: 'فشل في التحقق من صحة البيانات'
  },
  [ErrorType.AUTHENTICATION]: {
    en: 'Authentication required',
    ar: 'المصادقة مطلوبة'
  },
  [ErrorType.AUTHORIZATION]: {
    en: 'Access denied',
    ar: 'تم رفض الوصول'
  },
  [ErrorType.NOT_FOUND]: {
    en: 'Resource not found',
    ar: 'المورد غير موجود'
  },
  [ErrorType.UAE_PASS]: {
    en: 'UAE Pass authentication failed',
    ar: 'فشلت مصادقة الهوية الرقمية الإماراتية'
  },
  [ErrorType.CULTURAL]: {
    en: 'Cultural calendar conflict',
    ar: 'تعارض في التقويم الثقافي'
  },
  [ErrorType.COMPLIANCE]: {
    en: 'GCC compliance violation',
    ar: 'انتهاك لمتطلبات الامتثال لدول مجلس التعاون الخليجي'
  },
  [ErrorType.RATE_LIMIT]: {
    en: 'Rate limit exceeded',
    ar: 'تم تجاوز الحد المسموح من الطلبات'
  },
  [ErrorType.DATABASE]: {
    en: 'Database operation failed',
    ar: 'فشلت عملية قاعدة البيانات'
  },
  [ErrorType.EXTERNAL_API]: {
    en: 'External service unavailable',
    ar: 'الخدمة الخارجية غير متاحة'
  },
  [ErrorType.INTERNAL]: {
    en: 'Internal server error',
    ar: 'خطأ داخلي في الخادم'
  }
};

// Helper functions to create common errors
export const createValidationError = (message: string, details?: any) => {
  return new UAEWorkHubError(
    ErrorType.VALIDATION,
    message,
    ERROR_MESSAGES[ErrorType.VALIDATION].ar,
    400,
    details
  );
};

export const createAuthenticationError = (message?: string) => {
  return new UAEWorkHubError(
    ErrorType.AUTHENTICATION,
    message || ERROR_MESSAGES[ErrorType.AUTHENTICATION].en,
    ERROR_MESSAGES[ErrorType.AUTHENTICATION].ar,
    401
  );
};

export const createAuthorizationError = (message?: string) => {
  return new UAEWorkHubError(
    ErrorType.AUTHORIZATION,
    message || ERROR_MESSAGES[ErrorType.AUTHORIZATION].en,
    ERROR_MESSAGES[ErrorType.AUTHORIZATION].ar,
    403
  );
};

export const createNotFoundError = (resource: string) => {
  return new UAEWorkHubError(
    ErrorType.NOT_FOUND,
    `${resource} not found`,
    ERROR_MESSAGES[ErrorType.NOT_FOUND].ar,
    404
  );
};

export const createUAEPassError = (message: string) => {
  return new UAEWorkHubError(
    ErrorType.UAE_PASS,
    message,
    ERROR_MESSAGES[ErrorType.UAE_PASS].ar,
    401
  );
};

export const createCulturalError = (message: string, details?: any) => {
  return new UAEWorkHubError(
    ErrorType.CULTURAL,
    message,
    ERROR_MESSAGES[ErrorType.CULTURAL].ar,
    400,
    details
  );
};

export const createComplianceError = (message: string, details?: any) => {
  return new UAEWorkHubError(
    ErrorType.COMPLIANCE,
    message,
    ERROR_MESSAGES[ErrorType.COMPLIANCE].ar,
    403,
    details
  );
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorType = ErrorType.INTERNAL;
  let message = 'Internal server error';
  let messageAr = ERROR_MESSAGES[ErrorType.INTERNAL].ar;
  let details: any = undefined;

  // Log error for debugging
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle UAE Work Hub errors
  if (error instanceof UAEWorkHubError) {
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
    messageAr = error.messageAr;
    details = error.details;
  }
  // Handle Zod validation errors
  else if (error instanceof z.ZodError) {
    statusCode = 400;
    errorType = ErrorType.VALIDATION;
    message = 'Validation failed';
    messageAr = ERROR_MESSAGES[ErrorType.VALIDATION].ar;
    details = {
      issues: error.errors.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
  }
  // Handle MongoDB errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorType = ErrorType.DATABASE;
    message = 'Database validation failed';
    messageAr = ERROR_MESSAGES[ErrorType.DATABASE].ar;
    details = { mongoError: error.message };
  }
  else if (error.name === 'CastError') {
    statusCode = 400;
    errorType = ErrorType.DATABASE;
    message = 'Invalid ID format';
    messageAr = 'تنسيق المعرف غير صحيح';
  }
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    errorType = ErrorType.DATABASE;
    message = 'Duplicate entry';
    messageAr = 'إدخال مكرر';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = ErrorType.AUTHENTICATION;
    message = 'Invalid token';
    messageAr = 'رمز غير صحيح';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = ErrorType.AUTHENTICATION;
    message = 'Token expired';
    messageAr = 'انتهت صلاحية الرمز';
  }
  // Handle CORS errors
  else if (error.message === 'Not allowed by CORS') {
    statusCode = 403;
    errorType = ErrorType.AUTHORIZATION;
    message = 'Origin not allowed';
    messageAr = 'المصدر غير مسموح';
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      type: errorType,
      message,
      messageAr,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = details;
    errorResponse.error.stack = error.stack;
  }

  // Add compliance information for certain errors
  if (errorType === ErrorType.COMPLIANCE) {
    errorResponse.error.compliance = {
      gccStandards: true,
      dataResidency: 'UAE',
      auditTrail: true
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createNotFoundError(`Route ${req.originalUrl}`);
  next(error);
};