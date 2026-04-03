import { Insertable, Selectable, Updateable } from 'kysely';
import { BaseTable } from '../../shared/types/base.table';

export interface NoticesTable extends BaseTable {
  title: string;
  body: string;
  level: 'info' | 'warning' | 'danger' | 'success';
  isActive: 0 | 1; // Usamos 0/1 para booleanos en la base de datos
  startsAt: Date;
  endsAt: Date;
}

// Tipos derivados — estos son tus "entities/models" en este enfoque
export type Notice = Selectable<NoticesTable>;
export type NewNotice = Insertable<NoticesTable>;
export type UpdateNotice = Updateable<NoticesTable>;
