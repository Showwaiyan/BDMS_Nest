import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from './generated';

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating roles...');

  const roles = ['ADMIN', 'STAFF', 'USER'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating admin and user accounts...');

  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordUser = await bcrypt.hash('user123', 10);

  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        user_name: 'admin',
        email: 'admin@example.com',
        password: passwordAdmin,
        role_id: adminRole.id,
        is_active: true,
      },
    });
  }

  if (userRole) {
    await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        user_name: 'user',
        email: 'user@example.com',
        password: passwordUser,
        role_id: userRole.id,
        is_active: true,
      },
    });
  }

  console.log('💀 Successfully seeded roles and accounts.');

  // ADD MORE seeding logic here (e.g., seeding donations, requests, announcements etc.)

  console.log('\n🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
