import { BaseEntity } from '../types/base.entity';
import { PaginatedFilter } from '../schemas/common.schema';
import { PaginatedResult } from '../types/api.types';

// T = tipo del modelo (Notice, User, etc.)
// W = tipo del where de Prisma (Prisma.NoticeWhereInput, etc.)
// C = tipo del create de Prisma
// U = tipo del update de Prisma
export abstract class BaseRepository<T extends BaseEntity, W, C, U> {
  // Cada repositorio hijo indica su delegate de Prisma
  // (prisma.notice, prisma.user, etc.)
  protected abstract delegate: {
    count: (args: { where?: W }) => Promise<number>;
    findMany: (args: { where?: W; orderBy?: object; skip?: number; take?: number }) => Promise<T[]>;
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
    create: (args: { data: C }) => Promise<T>;
    update: (args: {
      where: { id: string };
      data: U | (Omit<U, 'version'> & { version?: { increment: number } });
    }) => Promise<T>;
    delete: (args: { where: { id: string } }) => Promise<T>;
  };

  async findWithFilters(
    where: W,
    {
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    }: Partial<PaginatedFilter> = {},
  ): Promise<PaginatedResult<T>> {
    const [total, data] = await Promise.all([
      this.delegate.count({ where }),
      this.delegate.findMany({
        where,
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit: pageSize, pages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async create(data: C): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: U): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = this.delegate as any;
    return delegate.update({
      where: { id },
      data: {
        ...(data as object),
        version: { increment: 1 },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.delegate.delete({ where: { id } });
    return true;
  }
}
