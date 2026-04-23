import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('Admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@3waymatch.com' },
    update: {},
    create: {
      email: 'admin@3waymatch.com',
      password: hashedPassword,
      name: 'Admin',
      isAdmin: true,
    },
  });

  // Create default tolerance config
  await prisma.toleranceConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Default',
      isDefault: true,
      priceTolerancePct: 3.0,
      qtyTolerancePct: 5.0,
      taxTolerancePct: 1.0,
      amountToleranceAbs: 5.0,
      autoApproveThreshold: 0.95,
      reviewThreshold: 0.70,
    },
  });

  console.log('Seed complete: admin user + default tolerance config');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
