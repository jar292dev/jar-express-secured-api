import { PaginatedResult } from '../../db/base.repository';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app.error';
import { PaginatedFilter } from '../../shared/schemas/common.schema';
import { NoticesRepository } from './notices.repository';
import { CreateNoticeDTO, NoticeFilterDTO, UpdateNoticeDTO } from './notices.schema';
import { Notice, UpdateNotice } from './notices.table';

export class NoticesService {
  constructor(private repository: NoticesRepository) {}

  // Aquí puedes implementar la lógica de negocio para manejar los avisos
  // Por ejemplo, métodos para crear, obtener, actualizar y eliminar avisos

  async findNoticeById(id: string): Promise<Notice> {
    const notice = await this.repository.findById(id);
    if (!notice) throw new NotFoundError('Aviso no encontrado', id);
    return notice;
  }

  async findAll(
    filters: Partial<NoticeFilterDTO>,
    pagination: Partial<PaginatedFilter>,
  ): Promise<PaginatedResult<Notice>> {
    // Aquí iría lógica de negocio si la hubiera:
    // validaciones cruzadas, enriquecer filtros, permisos, etc.
    return this.repository.findWithFilters(filters, pagination);
  }

  async createNotice(data: CreateNoticeDTO): Promise<Notice> {
    const existing = await this.repository.findWithFilters({ title: data.title });
    if (existing.data.length > 0) throw new ConflictError('Notice', 'title');
    return this.repository.create(data as any);
  }

  async updateNotice(id: string, data: UpdateNoticeDTO): Promise<Notice> {
    await this.findNoticeById(id); // Validar que existe

    const updatedNotice = await this.repository.update(id, data as UpdateNotice);
    if (!updatedNotice) throw new BadRequestError('Failed to update notice'); // Verificar que la actualización fue exitosa

    return updatedNotice;
  }

  async deleteNotice(id: string): Promise<void> {
    await this.findNoticeById(id); // findNoticeById ya lanza NotFoundError si no existe
    await this.repository.delete(id);
  }
}
