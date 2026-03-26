import { Request } from 'express';
import { prisma } from '../lib/prisma.js';

interface AuditLogParams {
  req: Request;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
}

/**
 * Enterprise-grade audit logging for sensitive system changes.
 */
export const logAudit = async ({ 
  req, 
  userId, 
  action, 
  resource, 
  resourceId, 
  details 
}: AuditLogParams): Promise<void> => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details || {},
        ipAddress,
      },
    });
  } catch (error) {
    // We log the error but don't fail the parent transaction
    console.error('[AuditLogger] Failed to create audit log:', error);
  }
};
