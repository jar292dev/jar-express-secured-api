import { Notice, Prisma } from '../../generated/prisma';
import { ConflictError } from '../../shared/errors/app.error';
import { AuditRepository } from '../../shared/repositories/audit.repository';
import { BaseService } from '../../shared/services/base.service';
import { RequestContext } from '../../shared/types/request-context';
import { PaginatedFilter } from '../../shared/schemas/common.schema';
import { PaginatedResult } from '../../shared/types/api.types';
import { NoticesRepository } from './notices.repository';
import { CreateNoticeDTO, NoticeFilterDTO, UpdateNoticeDTO } from './notices.schema';

export class NoticesService extends BaseService<
  Notice,
  Prisma.NoticeWhereInput,
  CreateNoticeDTO,
  UpdateNoticeDTO
> {
  protected entityName = 'Notice';

  constructor(
    protected repository: NoticesRepository,
    auditRepository: AuditRepository,
  ) {
    super(repository, auditRepository);
  }

  async findNoticeById(id: string): Promise<Notice> {
    return this.findById(id);
  }

  async findAll(
    filters: Partial<NoticeFilterDTO>,
    pagination: Partial<PaginatedFilter>,
  ): Promise<PaginatedResult<Notice>> {
    return super.findAll(filters as Prisma.NoticeWhereInput, pagination);
  }

  async createNotice(data: CreateNoticeDTO, context: RequestContext): Promise<Notice> {
    const existing = await this.repository.findWithFilters({ title: data.title });
    if (existing.data.length > 0) throw new ConflictError('Notice', 'title');

    const isActive =
      typeof data.isActive === 'string' ? data.isActive === 'true' : (data.isActive ?? false);
    const startsAt = new Date(data.startsAt!);
    const endsAt = new Date(data.endsAt!);
    data = { ...data, isActive, startsAt, endsAt };
    return super.create(data, context);
  }

  async updateNotice(id: string, data: UpdateNoticeDTO, context: RequestContext): Promise<Notice> {
    const isActive =
      typeof data.isActive === 'string' ? data.isActive === 'true' : (data.isActive ?? false);
    const startsAt = new Date(data.startsAt!);
    const endsAt = new Date(data.endsAt!);
    data = { ...data, isActive, startsAt, endsAt };
    return super.update(id, data, context);
  }

  async deleteNotice(id: string, context: RequestContext): Promise<void> {
    return super.delete(id, context);
  }
}
