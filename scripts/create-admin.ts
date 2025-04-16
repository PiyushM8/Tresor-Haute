import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const password = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tresor-haute.com' },
    update: {},
    create: {
      email: 'admin@tresor-haute.com',
      name: 'Admin User',
      password,
      role: Role.ADMIN,
    },
  });

  console.log('Admin user created:', admin);
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 