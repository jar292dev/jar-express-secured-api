import { afterAll } from 'vitest';
import { prisma } from '../database/prisma.client';

afterAll(async () => {
  await prisma.$disconnect();
});
