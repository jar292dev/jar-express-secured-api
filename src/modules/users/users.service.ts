import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/app.error';
import { RequestContext } from '../../shared/types/request-context';
import { passwordUtils } from '../../shared/utils/password.utils';
import { AuditRepository } from '../../shared/repositories/audit.repository';
import { PaginatedFilter } from '../../shared/schemas/common.schema';
import { PaginatedResult } from '../../shared/types/api.types';
import { AuthRepository } from '../auth/auth.repository';
import { SafeUser, UsersRepository } from './users.repository';
import { UserCreateDTO, UserFilterDTO, UserUpdateDTO, UserUpdateMeDTO } from './users.schema';
import { v7 as uuidv7 } from 'uuid';
import { Prisma } from '../../generated/prisma';

export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private authRepository: AuthRepository,
    private auditRepository: AuditRepository,
  ) {}

  async findAll(
    filters: Partial<UserFilterDTO>,
    pagination: Partial<PaginatedFilter>,
  ): Promise<PaginatedResult<SafeUser>> {
    const { email, role, isActive } = filters;
    const where: Prisma.UserWhereInput = {
      ...(email && { email: { contains: email } }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };
    return this.usersRepository.findWithFilters(where, pagination);
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError('Usuario no encontrado', id);
    return user;
  }

  async findMe(context: RequestContext): Promise<SafeUser> {
    if (!context.actorId) throw new NotFoundError('Usuario no encontrado', '');
    return this.findById(context.actorId);
  }

  async create(data: UserCreateDTO, context: RequestContext): Promise<SafeUser> {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) throw new ConflictError('User', 'email');

    const passwordHash = await passwordUtils.hash(data.password);
    const created = await this.authRepository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    await this.auditRepository.log({
      entity: 'User',
      entityId: created.id,
      action: 'CREATE',
      actorId: context.actorId,
      after: created as object,
    });

    return this.findById(created.id);
  }

  async update(id: string, data: UserUpdateDTO, context: RequestContext): Promise<SafeUser> {
    const before = await this.findById(id);

    const updated = await this.usersRepository.update(id, {
      ...data,
      updatedBy: context.actorId,
    });

    await this.auditRepository.log({
      entity: 'User',
      entityId: id,
      action: 'UPDATE',
      actorId: context.actorId,
      before: before as object,
      after: updated as object,
    });

    return updated!;
  }

  async updateMe(context: RequestContext, data: UserUpdateMeDTO): Promise<SafeUser> {
    if (!context.actorId) throw new NotFoundError('Usuario no encontrado', '');
    return this.update(context.actorId, data, context);
  }

  async delete(id: string, context: RequestContext): Promise<void> {
    // No puede borrarse a sí mismo
    if (id === context.actorId) {
      throw new ForbiddenError('No puedes eliminar tu propia cuenta');
    }

    const before = await this.findById(id);
    await this.usersRepository.delete(id);

    await this.auditRepository.log({
      entity: 'User',
      entityId: id,
      action: 'DELETE',
      actorId: context.actorId,
      before: before as object,
    });
  }
}
