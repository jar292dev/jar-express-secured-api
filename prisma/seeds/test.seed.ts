import { v7 as uuidv7 } from 'uuid';
import { prisma } from '../../src/database/prisma.client';
import { passwordUtils } from '../../src/shared/utils/password.utils';
import { env } from '../../src/config/env';

interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'user';
  password: string;
  envEmailKey: string;
  envPasswordKey: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'test-admin@example.com',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    password: 'TestAdmin1234!',
    envEmailKey: 'SEED_ADMIN_EMAIL',
    envPasswordKey: 'SEED_ADMIN_PASSWORD',
  },
  {
    email: 'test-moderator@example.com',
    firstName: 'Test',
    lastName: 'Moderator',
    role: 'moderator',
    password: 'TestModerator1234!',
    envEmailKey: 'SEED_MODERATOR_EMAIL',
    envPasswordKey: 'SEED_MODERATOR_PASSWORD',
  },
  {
    email: 'test-user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    password: 'TestUser1234!',
    envEmailKey: 'SEED_USER_EMAIL',
    envPasswordKey: 'SEED_USER_PASSWORD',
  },
];

async function createTestUserIfNotExists(user: TestUser): Promise<void> {
  const email = process.env[user.envEmailKey] ?? user.email;
  const password = process.env[user.envPasswordKey] ?? user.password;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`⏩  Test user ya existe: ${email}`);
    return;
  }

  const passwordHash = await passwordUtils.hash(password);

  await prisma.user.create({
    data: {
      id: uuidv7(),
      email,
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
  console.log(`✅ Test user creado: ${email} (${user.role})`);
}

export async function seedTestData(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🧪 Seed de test...');

  for (const user of TEST_USERS) {
    await createTestUserIfNotExists(user);
  }
}
