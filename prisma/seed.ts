import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating roles and permissions...');

  const roles = ['ADMIN', 'STAFF', 'USER'];
  const permissions = [
    // Users & Roles
    'user.manage',
    'role.manage',
    
    // Donations
    'donation.create',
    'donation.approve',
    'donation.view',
    'donation.delete',
    
    // Requests
    'request.create',
    'request.approve',
    'request.view',
    'request.delete',
    
    // Appointments
    'appointment.create',
    'appointment.manage',
    'appointment.view',
    
    // Medical Records
    'medical.create',
    'medical.manage',
    'medical.view',
    
    // Announcements
    'announcement.create',
    'announcement.manage',
    'announcement.view',
    
    // Inventory & Certificates
    'inventory.view',
    'inventory.manage',
    'certificate.issue',
    'certificate.view'
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
    // Staff permissions
    const staffPerms = [
      'donation.approve', 
      'donation.view',
      'request.approve', 
      'request.view',
      'appointment.manage',
      'appointment.view',
      'medical.create',
      'medical.manage',
      'medical.view',
      'inventory.view',
      'inventory.manage',
      'certificate.issue',
      'announcement.view'
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
    // User permissions (Regular Donor)
    const userPerms = [
      'donation.create',
      'donation.view',
      'request.create',
      'request.view',
      'appointment.create',
      'appointment.view',
      'certificate.view',
      'announcement.view'
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
