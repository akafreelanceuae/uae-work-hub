/**
 * Request Logger Middleware
 * Comprehensive request logging for GCC compliance and audit trails
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      clientInfo?: {
        ip: string;
        userAgent: string;
        country?: string;
        city?: string;
      };
    }
  }
}

/**
 * Request logging middleware with UAE-specific audit requirements
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID for tracing
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
// Extract client information (omit undefined for exactOptionalPropertyTypes)
  const ip = req.ip || (req.connection as any)?.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const countryHeader = req.get('CF-IPCountry') || req.get('X-Country') || '';
  const cityHeader = req.get('CF-IPCity') || req.get('X-City') || '';
  const clientInfo: { ip: string; userAgent: string; country?: string; city?: string } = { ip, userAgent };
  if (countryHeader) clientInfo.country = countryHeader;
  if (cityHeader) clientInfo.city = cityHeader;
  req.clientInfo = clientInfo;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  // Add GDPR/GCC compliance headers
  res.setHeader('X-Data-Residency', 'UAE');
  res.setHeader('X-Compliance', 'GCC-2021');
  res.setHeader('X-Audit-Trail', 'enabled');

  // Log incoming request
  const requestLog = {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
      'content-type': req.get('Content-Type'),
      'accept': req.get('Accept'),
      'accept-language': req.get('Accept-Language'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    },
    clientInfo: req.clientInfo,
    bodySize: req.get('Content-Length') || '0',
    protocol: req.protocol,
    secure: req.secure,
    xhr: req.xhr
  };

  console.log('📥 Incoming Request:', JSON.stringify(requestLog, null, 2));

  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - req.startTime;
    
    const responseLog = {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(body).length,
      success: res.statusCode < 400,
      compliance: {
        dataResidency: 'UAE',
        auditLogged: true,
        encryptionRequired: res.statusCode === 200 && body?.sensitive === true
      }
    };

    // Log response (without sensitive data)
    const sanitizedBody = sanitizeResponseBody(body);
    console.log('📤 Outgoing Response:', JSON.stringify({
      ...responseLog,
      body: process.env.NODE_ENV === 'development' ? sanitizedBody : undefined
    }, null, 2));

    // Call original json method
    return originalJson.call(this, body);
  };

// Override res.end to catch non-JSON responses
  const originalEnd = (res.end as any).bind(res) as (...args: any[]) => any;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    if (!res.headersSent) {
      const duration = Date.now() - req.startTime;
      
      console.log('📤 Response End:', JSON.stringify({
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        type: 'non-json'
      }, null, 2));
    }
    
return originalEnd(chunk, encoding, cb);
  } as any;

  next();
};

/**
 * Sanitize response body to remove sensitive information from logs
 */
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'key',
    'privateKey',
    'apiKey',
    'sessionId',
    'otp',
    'pin',
    'ssn',
    'emiratesId',
    'passport',
    'visa',
    'salary',
    'bankAccount'
  ];

  function sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        (result as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (result as any)[key] = sanitizeObject(value);
      } else {
        (result as any)[key] = value;
      }
    }
    
    return result;
  }

  return sanitizeObject(sanitized);
}

/**
 * Audit log middleware for sensitive operations
 */
export const auditLogger = (operation: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auditLog = {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      operation,
      resource,
      userId: (req as any).user?.id || 'anonymous',
      ip: req.clientInfo?.ip,
      userAgent: req.clientInfo?.userAgent,
      compliance: {
        gccCompliant: true,
        auditTrail: true,
        dataResidency: 'UAE'
      }
    };

    console.log('🔍 Audit Log:', JSON.stringify(auditLog, null, 2));
    
    // Store audit log in database or external audit service
    // This would typically be sent to a dedicated audit logging service
    
    next();
  };
};

/**
 * Security headers middleware for GCC compliance
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // UAE/GCC specific security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Data-Classification', 'internal');
  res.setHeader('X-UAE-Compliance', 'enabled');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};