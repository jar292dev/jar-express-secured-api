import { prisma } from '../../database/prisma.client';
import { v7 as uuidv7 } from 'uuid';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

interface CreateAuditLogParams {
  entity: string;
  entityId: string;
  action: AuditAction;
  actorId: string | null;
  before?: object | null;
  after?: object | null;
}

export class AuditRepository {
  async log(params: CreateAuditLogParams): Promise<void> {
    await prisma.auditLog.create({
      data: {
        id: uuidv7(),
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
      },
    });
  }
}
