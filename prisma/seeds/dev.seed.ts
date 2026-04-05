import { v7 as uuidv7 } from 'uuid';
import { prisma } from '../../src/database/prisma.client';
import { passwordUtils } from '../../src/shared/utils/password.utils';
import { UserRole } from '../../src/generated/prisma';

interface DevUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  password: string;
}

const DEV_USERS: DevUser[] = [
  {
    email: 'moderator@example.com',
    firstName: 'Moderator',
    lastName: 'Dev',
    role: 'moderator',
    password: 'Moderator1234!',
  },
  {
    email: 'user@example.com',
    firstName: 'User',
    lastName: 'Dev',
    role: 'user',
    password: 'User1234!',
  },
];

const DEV_NOTICES = [
  {
    title: 'Mantenimiento programado',
    body: 'El sistema estará en mantenimiento el próximo domingo de 02:00 a 04:00.',
    level: 'warning' as const,
    isActive: true,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Nueva funcionalidad disponible',
    body: 'Ya puedes gestionar tus notificaciones desde el panel de usuario.',
    level: 'info' as const,
    isActive: true,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Servicio de pagos degradado',
    body: 'Estamos trabajando para resolver un problema con el servicio de pagos.',
    level: 'danger' as const,
    isActive: true,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    title: 'Incidencia de acceso resuelta',
    body: 'El problema de acceso reportado ayer ha sido resuelto satisfactoriamente.',
    level: 'success' as const,
    isActive: true,
    startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
];

async function createUserIfNotExists(user: DevUser): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });

  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`⏩  Usuario ya existe: ${user.email}`);
    return;
  }

  const passwordHash = await passwordUtils.hash(user.password);

  await prisma.user.create({
    data: {
      id: uuidv7(),
      email: user.email,
      passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
}

async function createNoticesIfEmpty(): Promise<void> {
  const count = await prisma.notice.count();

  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`⏩  Notices ya existen (${count}), omitiendo`);
    return;
  }

  await prisma.notice.createMany({
    data: DEV_NOTICES.map((notice) => ({
      id: uuidv7(),
      ...notice,
    })),
  });

  // eslint-disable-next-line no-console
  console.log(`✅ ${DEV_NOTICES.length} notices de ejemplo creados`);
}

export async function seedDevData(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🔧 Seed de desarrollo...');

  for (const user of DEV_USERS) {
    await createUserIfNotExists(user);
  }

  await createNoticesIfEmpty();
}
