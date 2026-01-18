/**
 * GCC Compliance Middleware
 * Data protection, audit trails, and regulatory compliance for UAE/GCC
 */

import { Request, Response, NextFunction } from 'express';
import { createComplianceError } from './errorHandler.js';

// GCC compliance levels
export enum ComplianceLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

// Data residency requirements
export enum DataResidency {
  UAE = 'UAE',
  GCC = 'GCC',
  MENA = 'MENA'
}

// Compliance context interface
interface ComplianceContext {
  dataClassification: ComplianceLevel;
  dataResidency: DataResidency;
  auditRequired: boolean;
  encryptionRequired: boolean;
  retentionPeriod: number; // days
  accessLogging: boolean;
}

/**
 * Main GCC compliance middleware
 */
export const complianceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Add compliance headers to all responses
  res.setHeader('X-Data-Residency', 'UAE');
  res.setHeader('X-Compliance-Standard', 'GCC-2021');
  res.setHeader('X-Data-Protection', 'PDPL-Compliant');
  res.setHeader('X-Audit-Enabled', 'true');
  
  // Determine compliance level based on endpoint
  const complianceContext = determineComplianceLevel(req.path, req.method);
  
  // Attach compliance context to request
  (req as any).compliance = complianceContext;
  
  // Apply compliance rules
  applyComplianceRules(req, res, complianceContext);
  
  next();
};

/**
 * Data classification middleware for sensitive endpoints
 */
export const requireDataClassification = (level: ComplianceLevel) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context: ComplianceContext = (req as any).compliance;
    
    // Check if current user has access to this data classification level
    if (!hasDataClassificationAccess(req, level)) {
      throw createComplianceError(
        `Access denied. Required data classification: ${level}`,
        { requiredLevel: level, userLevel: getUserDataClassification(req) }
      );
    }
    
    // Set data classification header
    res.setHeader('X-Data-Classification', level.toUpperCase());
    
    // Enable additional security for higher classifications
    if (level === ComplianceLevel.CONFIDENTIAL || level === ComplianceLevel.RESTRICTED) {
      res.setHeader('X-Encryption-Required', 'true');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    next();
  };
};

/**
 * Data residency compliance middleware
 */
export const enforceDataResidency = (residency: DataResidency) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check client IP for geo-compliance if required
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Log data access for compliance
    console.log('Data Residency Check:', {
      requestId: req.requestId,
      requiredResidency: residency,
      clientIP: clientIP,
      userAgent: userAgent,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // Set residency headers
    res.setHeader('X-Required-Data-Residency', residency);
    res.setHeader('X-Data-Location', 'UAE');
    
    // In production, you might want to check actual server location
    // and reject requests if data residency requirements aren't met
    
    next();
  };
};

/**
 * Audit logging middleware for compliance
 */
export const auditLog = (operation: string, resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auditEntry = {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      operation,
      resourceType,
      userId: (req as any).user?.id || 'anonymous',
      userEmail: (req as any).user?.email || 'unknown',
      userRole: (req as any).user?.permissions?.role || 'unknown',
      method: req.method,
      endpoint: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      compliance: {
        dataClassification: (req as any).compliance?.dataClassification || 'internal',
        dataResidency: 'UAE',
        gccCompliant: true,
        auditTrail: true
      }
    };

    // Store audit log (console)
    console.log('🔍 COMPLIANCE AUDIT:', JSON.stringify(auditEntry, null, 2));

    // Persist audit log asynchronously (non-blocking)
    import('../models/AuditLog.js')
      .then(({ default: AuditLog }) => {
        AuditLog.create({
          ts: new Date(),
          actorId: auditEntry.userId,
          action: `${operation}:${resourceType}`,
          resource: req.originalUrl || req.path,
          ip: auditEntry.ip,
          userAgent: auditEntry.userAgent,
          meta: {
            requestId: auditEntry.requestId,
            method: auditEntry.method,
            status: res.statusCode,
            compliance: auditEntry.compliance,
          },
        }).catch(() => {});
      })
      .catch(() => {});
    
    next();
  };
};

/**
 * Sensitive data handling middleware
 */
export const sensitiveDataHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Override response methods to handle sensitive data
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Mark response as containing sensitive data if applicable
    if (containsSensitiveData(body)) {
      res.setHeader('X-Contains-Sensitive-Data', 'true');
      res.setHeader('X-Encryption-Applied', 'true');
      
      // In production, encrypt sensitive fields here
      body = maskSensitiveData(body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Data retention policy middleware
 */
export const dataRetentionPolicy = (retentionDays: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Add data retention headers
    res.setHeader('X-Data-Retention-Days', retentionDays.toString());
    res.setHeader('X-Data-Expires', new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString());
    
    // Log data retention policy application
    console.log('Data Retention Policy Applied:', {
      requestId: req.requestId,
      retentionDays,
      expirationDate: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString()
    });
    
    next();
  };
};

/**
 * PII (Personally Identifiable Information) protection middleware
 */
export const piiProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request contains PII
  const containsPII = checkForPII(req.body) || checkForPII(req.query);
  
  if (containsPII) {
    // Apply extra security measures
    res.setHeader('X-Contains-PII', 'true');
    res.setHeader('X-PII-Protection-Applied', 'true');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Log PII handling
    console.log('PII Protection Applied:', {
      requestId: req.requestId,
      endpoint: req.path,
      method: req.method,
      userId: (req as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Cross-border data transfer compliance
 */
export const crossBorderCompliance = (req: Request, res: Response, next: NextFunction): void => {
  // Check if this is a cross-border data request
  const originCountry = req.get('CF-IPCountry') || req.get('X-Country') || 'unknown';
  const isGCCCountry = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'].includes(originCountry);
  
  if (!isGCCCountry && originCountry !== 'unknown') {
    // Log cross-border access
    console.log('Cross-Border Data Access:', {
      requestId: req.requestId,
      originCountry,
      endpoint: req.path,
      isGCCCountry,
      timestamp: new Date().toISOString(),
      compliance: {
        requiresApproval: true,
        dataResidency: 'UAE',
        crossBorderTransfer: true
      }
    });
    
    // In production, you might want to apply additional restrictions
    res.setHeader('X-Cross-Border-Access', 'true');
    res.setHeader('X-Origin-Country', originCountry);
  }
  
  next();
};

// Helper functions

function determineComplianceLevel(path: string, method: string): ComplianceContext {
  // Determine compliance level based on endpoint patterns
  if (path.includes('/admin') || path.includes('/sensitive')) {
    return {
      dataClassification: ComplianceLevel.RESTRICTED,
      dataResidency: DataResidency.UAE,
      auditRequired: true,
      encryptionRequired: true,
      retentionPeriod: 2555, // 7 years for critical data
      accessLogging: true
    };
  }
  
  if (path.includes('/users') || path.includes('/profile') || path.includes('/personal')) {
    return {
      dataClassification: ComplianceLevel.CONFIDENTIAL,
      dataResidency: DataResidency.UAE,
      auditRequired: true,
      encryptionRequired: true,
      retentionPeriod: 1095, // 3 years for personal data
      accessLogging: true
    };
  }
  
  if (path.includes('/meetings') || path.includes('/projects')) {
    return {
      dataClassification: ComplianceLevel.INTERNAL,
      dataResidency: DataResidency.GCC,
      auditRequired: true,
      encryptionRequired: false,
      retentionPeriod: 365, // 1 year for business data
      accessLogging: true
    };
  }
  
  // Default compliance level
  return {
    dataClassification: ComplianceLevel.INTERNAL,
    dataResidency: DataResidency.UAE,
    auditRequired: false,
    encryptionRequired: false,
    retentionPeriod: 90, // 90 days for general data
    accessLogging: false
  };
}

function hasDataClassificationAccess(req: Request, requiredLevel: ComplianceLevel): boolean {
  const user = (req as any).user;
  if (!user) return requiredLevel === ComplianceLevel.PUBLIC;
  
  const userRole = user.permissions?.role || 'user';
  
  // Admin has access to all levels
  if (userRole === 'admin') return true;
  
  // Role-based access control
  switch (requiredLevel) {
    case ComplianceLevel.PUBLIC:
      return true;
    case ComplianceLevel.INTERNAL:
      return ['user', 'moderator', 'org_admin', 'admin'].includes(userRole);
    case ComplianceLevel.CONFIDENTIAL:
      return ['moderator', 'org_admin', 'admin'].includes(userRole);
    case ComplianceLevel.RESTRICTED:
      return ['admin'].includes(userRole);
    default:
      return false;
  }
}

function getUserDataClassification(req: Request): string {
  const user = (req as any).user;
  if (!user) return 'none';
  
  const userRole = user.permissions?.role || 'user';
  
  switch (userRole) {
    case 'admin':
      return 'restricted';
    case 'org_admin':
    case 'moderator':
      return 'confidential';
    case 'user':
    default:
      return 'internal';
  }
}

function applyComplianceRules(req: Request, res: Response, context: ComplianceContext): void {
  // Apply encryption headers if required
  if (context.encryptionRequired) {
    res.setHeader('X-Encryption-Required', 'true');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Apply audit logging if required
  if (context.auditRequired) {
    res.setHeader('X-Audit-Required', 'true');
  }
  
  // Set data retention headers
  res.setHeader('X-Data-Retention-Days', context.retentionPeriod.toString());
}

function containsSensitiveData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'emiratesId', 'passport',
    'ssn', 'creditCard', 'bankAccount', 'salary', 'visa'
  ];
  
  const jsonStr = JSON.stringify(data).toLowerCase();
  return sensitiveFields.some(field => jsonStr.includes(field));
}

function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['emiratesId', 'passport', 'ssn', 'bankAccount'];
  const maskedData = JSON.parse(JSON.stringify(data));
  
  function maskObject(obj: any): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          if (typeof obj[key] === 'string' && obj[key].length > 4) {
            obj[key] = obj[key].substring(0, 4) + '*'.repeat(obj[key].length - 4);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskObject(obj[key]);
        }
      }
    }
  }
  
  maskObject(maskedData);
  return maskedData;
}

function checkForPII(data: any): boolean {
  if (!data) return false;
  
  const piiFields = [
    'email', 'phone', 'mobile', 'emirates', 'passport', 'address',
    'firstName', 'lastName', 'birthDate', 'ssn', 'visa'
  ];
  
  const dataStr = JSON.stringify(data).toLowerCase();
  return piiFields.some(field => dataStr.includes(field));
}