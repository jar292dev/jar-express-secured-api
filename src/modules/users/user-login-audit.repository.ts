import { prisma } from '../../database/prisma.client';
import { v7 as uuidv7 } from 'uuid';

interface CreateLoginAuditParams {
  userId?: string | null;
  email: string;
  action: string;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  tokenJti?: string | null;
}

export class UserLoginAuditRepository {
  async log(params: CreateLoginAuditParams): Promise<void> {
    await prisma.userLoginAudit.create({
      data: {
        id: uuidv7(),
        userId: params.userId,
        email: params.email,
        action: params.action,
        success: params.success,
        failureReason: params.failureReason,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        tokenJti: params.tokenJti,
      },
    });
  }
}
