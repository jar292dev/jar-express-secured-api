import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../users.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/app.error';

const mockUsersRepository = {
  findWithFilters: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockAuthRepository = {
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
};

const mockAuditRepository = {
  log: vi.fn(),
};

const service = new UsersService(
  mockUsersRepository as any,
  mockAuthRepository as any,
  mockAuditRepository as any,
);

const mockUser = {
  id: '019d5d54-e733-743c-b40f-d681d11a56f8',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  version: 1,
};

const mockContext = {
  actorId: 'admin-id-0000-0000-000000000000',
  actorRole: 'admin',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
};

beforeEach(() => vi.clearAllMocks());

describe('UsersService', () => {
  describe('findById', () => {
    it('devuelve el usuario si existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('lanza NotFoundError si no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);
      await expect(service.findById('no-existe')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findMe', () => {
    it('devuelve el usuario autenticado', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      const result = await service.findMe(mockContext);
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findById).toHaveBeenCalledWith(mockContext.actorId);
    });

    it('lanza NotFoundError si actorId es null', async () => {
      await expect(service.findMe({ ...mockContext, actorId: null })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('create', () => {
    it('crea un usuario correctamente', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUser);
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.create(
        { email: 'test@example.com', password: 'Password123!' },
        mockContext,
      );

      expect(result).toEqual(mockUser);
      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'User' }),
      );
    });

    it('lanza ConflictError si el email ya existe', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create({ email: 'test@example.com', password: 'Password123!' }, mockContext),
      ).rejects.toThrow(ConflictError);

      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('actualiza un usuario correctamente', async () => {
      const updated = { ...mockUser, firstName: 'Actualizado' };
      mockUsersRepository.findById.mockResolvedValueOnce(mockUser);
      mockUsersRepository.update.mockResolvedValue(updated);

      const result = await service.update(mockUser.id, { firstName: 'Actualizado' }, mockContext);

      expect(result.firstName).toBe('Actualizado');
      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entity: 'User' }),
      );
    });

    it('lanza NotFoundError si el usuario no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.update('no-existe', { firstName: 'X' }, mockContext)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('elimina un usuario correctamente', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      await service.delete(mockUser.id, mockContext);

      expect(mockUsersRepository.delete).toHaveBeenCalledWith(mockUser.id);
      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entity: 'User' }),
      );
    });

    it('lanza ForbiddenError si intenta borrarse a sí mismo', async () => {
      await expect(service.delete(mockContext.actorId!, mockContext)).rejects.toThrow(
        ForbiddenError,
      );

      expect(mockUsersRepository.delete).not.toHaveBeenCalled();
    });

    it('lanza NotFoundError si el usuario no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.delete('no-existe', mockContext)).rejects.toThrow(NotFoundError);
    });
  });
});
