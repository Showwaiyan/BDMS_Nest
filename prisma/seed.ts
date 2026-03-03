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

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating roles and permissions...');

  const roles = ['ADMIN', 'STAFF', 'USER'];
  const permissions = [
    'donation.approve',
    'donation.create',
    'inventory.view',
    'user.manage'
  ];

  // Create Roles
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  // Create Permissions
  for (const permName of permissions) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });

  // Link Permissions (The "Proof" of role_permission table)
  if (adminRole) {
    // Admin gets everything
    for (const permName of permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: adminRole.id, permission_id: perm.id } },
          update: {},
          create: { role_id: adminRole.id, permission_id: perm.id },
        });
      }
    }
  }

  if (staffRole) {
    // Staff can approve donations and view inventory
    const staffPerms = ['donation.approve', 'inventory.view'];
    for (const permName of staffPerms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: staffRole.id, permission_id: perm.id } },
          update: {},
          create: { role_id: staffRole.id, permission_id: perm.id },
        });
      }
    }
  }

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating accounts...');

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
