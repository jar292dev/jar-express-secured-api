import { v7 as uuidv7 } from 'uuid';
import { env } from '../../src/config/env';
import { prisma } from '../../src/database/prisma.client';
import { passwordUtils } from '../../src/shared/utils/password.utils';

export async function seedAdmin(): Promise<void> {
  const adminEmail = env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = env.ADMIN_PASSWORD ?? 'Admin1234!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`⏩  Admin ya existe: ${adminEmail}`);
    return;
  }

  const passwordHash = await passwordUtils.hash(adminPassword);

  await prisma.user.create({
    data: {
      id: uuidv7(),
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Admin creado: ${adminEmail}`);
}
