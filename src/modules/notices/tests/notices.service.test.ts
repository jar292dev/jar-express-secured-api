import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoticesService } from '../notices.service';
import { NotFoundError, ConflictError } from '../../../shared/errors/app.error';

const mockRepository = {
  findById: vi.fn(),
  findWithFilters: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockAuditRepository = {
  log: vi.fn(),
};

const service = new NoticesService(mockRepository as any, mockAuditRepository as any);

const mockContext = {
  actorId: 'user-id-0000-0000-000000000000',
  actorRole: 'admin',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
};

const mockNotice = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test notice',
  body: 'Test body',
  level: 'info' as const,
  isActive: true,
  startsAt: new Date(),
  endsAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
  createdBy: null,
  updatedBy: null,
};

beforeEach(() => vi.clearAllMocks());

describe('NoticesService', () => {
  describe('findNoticeById', () => {
    it('devuelve el notice si existe', async () => {
      mockRepository.findById.mockResolvedValue(mockNotice);
      const result = await service.findNoticeById(mockNotice.id);
      expect(result).toEqual(mockNotice);
    });

    it('lanza NotFoundError si no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.findNoticeById('no-existe')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createNotice', () => {
    it('crea el notice si el título no existe', async () => {
      mockRepository.findWithFilters.mockResolvedValue({ data: [], meta: {} });
      mockRepository.create.mockResolvedValue(mockNotice);

      const result = await service.createNotice(
        {
          title: mockNotice.title,
          body: mockNotice.body,
          level: mockNotice.level,
          isActive: mockNotice.isActive,
          startsAt: mockNotice.startsAt,
          endsAt: mockNotice.endsAt,
        },
        mockContext,
      );

      expect(result).toEqual(mockNotice);
      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entity: 'Notice' }),
      );
    });

    it('lanza ConflictError si el título ya existe', async () => {
      mockRepository.findWithFilters.mockResolvedValue({ data: [mockNotice], meta: {} });

      await expect(
        service.createNotice({ title: mockNotice.title } as any, mockContext),
      ).rejects.toThrow(ConflictError);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateNotice', () => {
    it('actualiza el notice si existe', async () => {
      const updated = { ...mockNotice, title: 'Título actualizado' };
      mockRepository.findById.mockResolvedValue(mockNotice);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updateNotice(
        mockNotice.id,
        { title: 'Título actualizado' },
        mockContext,
      );

      expect(result.title).toBe('Título actualizado');
      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entity: 'Notice' }),
      );
    });

    it('lanza NotFoundError si no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateNotice('no-existe', { title: 'X' }, mockContext)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deleteNotice', () => {
    it('elimina el notice si existe', async () => {
      mockRepository.findById.mockResolvedValue(mockNotice);
      mockRepository.delete.mockResolvedValue(true);

      await expect(service.deleteNotice(mockNotice.id, mockContext)).resolves.toBeUndefined();

      expect(mockAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entity: 'Notice' }),
      );
    });

    it('lanza NotFoundError si no existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteNotice('no-existe', mockContext)).rejects.toThrow(NotFoundError);
    });
  });
});
