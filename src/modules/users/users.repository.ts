import { Prisma, User } from '../../generated/prisma';
import { prisma } from '../../database/prisma.client';
import { PaginatedFilter } from '../../shared/schemas/common.schema';
import { PaginatedResult } from '../../shared/types/api.types';

// Tipo seguro sin passwordHash para devolver al cliente
export type SafeUser = Omit<User, 'passwordHash'>;

export class UsersRepository {
  private get safeSelect(): Prisma.UserSelect {
    return {
      id: true,
      createdAt: true,
      updatedAt: true,
      version: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      locale: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdBy: true,
      updatedBy: true,
      passwordHash: false, // nunca exponer
      passwordChangedAt: false,
    };
  }

  async findWithFilters(
    where: Prisma.UserWhereInput,
    {
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    }: Partial<PaginatedFilter> = {},
  ): Promise<PaginatedResult<SafeUser>> {
    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: this.safeSelect,
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: data as SafeUser[],
      meta: {
        total,
        page,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: this.safeSelect,
    }) as Promise<SafeUser | null>;
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: this.safeSelect,
    }) as Promise<SafeUser | null>;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser | null> {
    return prisma.user.update({
      where: { id },
      data: { ...data, version: { increment: 1 } },
      select: this.safeSelect,
    }) as Promise<SafeUser | null>;
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
