import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating roles and permissions...');

  const roles = ['ADMIN', 'STAFF', 'USER'];
  const permissions = [
    // Users
    'user.access', 'user.create', 'user.update', 'user.delete', 'user.view',
    // Roles
    'role.access', 'role.create', 'role.update', 'role.delete', 'role.view',
    // Permissions
    'permission.access', 'permission.create', 'permission.update', 'permission.delete', 'permission.view',
    // Donors (Profiles/Applications)
    'donor.access', 'donor.create', 'donor.update', 'donor.delete', 'donor.view',
    // Donations (Actual blood units)
    'donation.access', 'donation.create', 'donation.update', 'donation.delete', 'donation.view',
    // Blood Requests
    'request.access', 'request.create', 'request.update', 'request.view',
    // Appointments
    'appointment.access', 'appointment.create', 'appointment.update', 'appointment.delete', 'appointment.view',
    // Medical Records
    'medical.access', 'medical.create', 'medical.update'
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

  // Link Permissions
  if (adminRole) {
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
    const staffPerms = [
      'user.view', 'donor.access', 'donor.view', 'donor.update',
      'donation.access', 'donation.view', 'donation.update',
      'request.access', 'request.view', 'request.update',
      'appointment.access', 'appointment.view', 'appointment.update',
      'medical.access', 'medical.create', 'medical.update'
    ];
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

  if (userRole) {
    // Only basic permissions for USER (cannot create donation yet, but can request)
    const userPerms = [
      'donor.create', 'donor.view', 'user.view', 'appointment.view', 'donation.view',
      'request.create', 'request.view'
    ];
    for (const permName of userPerms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: userRole.id, permission_id: perm.id } },
          update: {},
          create: { role_id: userRole.id, permission_id: perm.id },
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

  console.log('💀 Successfully seeded roles, permissions and accounts.');

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
