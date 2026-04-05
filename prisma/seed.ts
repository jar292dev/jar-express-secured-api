import { prisma } from '../src/database/prisma.client';
import { seedAdmin } from './seeds/admin.seed';
import { seedDevData } from './seeds/dev.seed';

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Ejecutando seed...');

  await seedAdmin();

  if (process.env.NODE_ENV !== 'production') {
    await seedDevData();
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
