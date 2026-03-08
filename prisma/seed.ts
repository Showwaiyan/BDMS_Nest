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
    'user.access',
    'user.create',
    'user.update',
    'user.delete',
    'user.view',
    // Roles
    'role.access',
    'role.create',
    'role.update',
    'role.delete',
    'role.view',
    // Permissions
    'permission.access',
    'permission.create',
    'permission.update',
    'permission.delete',
    'permission.view',
    // Donors
    'donor.access',
    'donor.create',
    'donor.update',
    'donor.delete',
    'donor.view',
    // Donations
    'donation.access',
    'donation.create',
    'donation.update',
    'donation.delete',
    'donation.view',
    // Blood Requests
    'request.access',
    'request.create',
    'request.update',
    'request.view',
    'request.delete',
    // Appointments
    'appointment.access',
    'appointment.create',
    'appointment.update',
    'appointment.delete',
    'appointment.view',
    // Medical Records
    'medical.access',
    'medical.create',
    'medical.update',
    'medical.view',
    'medical.delete',
    // Announcements
    'announcement.access',
    'announcement.create',
    'announcement.update',
    'announcement.delete',
    'announcement.view',
    // Inventory
    'inventory.access',
    'inventory.create',
    'inventory.update',
    'inventory.delete',
    'inventory.view',
    'inventory.manage',
    // Certificates
    'certificate.access',
    'certificate.create',
    'certificate.update',
    'certificate.delete',
    'certificate.view',
    'certificate.issue',
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
      const perm = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: adminRole.id,
              permission_id: perm.id,
            },
          },
          update: {},
          create: { role_id: adminRole.id, permission_id: perm.id },
        });
      }
    }
  }

  if (staffRole) {
    const staffPerms = [
      'user.access',
      'user.view',
      'donor.access',
      'donor.view',
      'donor.update',
      'donation.access',
      'donation.view',
      'donation.update',
      'request.access',
      'request.view',
      'request.update',
      'appointment.access',
      'appointment.view',
      'appointment.update',
      'medical.access',
      'medical.create',
      'medical.update',
      'medical.view',
      'announcement.access',
      'announcement.view',
      'announcement.update',
      'inventory.access',
      'inventory.view',
      'inventory.manage',
      'certificate.access',
      'certificate.view',
      'certificate.issue',
    ];
    for (const permName of staffPerms) {
      const perm = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: staffRole.id,
              permission_id: perm.id,
            },
          },
          update: {},
          create: { role_id: staffRole.id, permission_id: perm.id },
        });
      }
    }
  }

  if (userRole) {
    const userPerms = [
      'donor.create',
      'donor.view',
      'user.view',
      'appointment.view',
      'donation.view',
      'request.create',
      'request.view',
      'announcement.view',
      'certificate.view',
    ];
    for (const permName of userPerms) {
      const perm = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: userRole.id,
              permission_id: perm.id,
            },
          },
          update: {},
          create: { role_id: userRole.id, permission_id: perm.id },
        });
      }
    }
  }

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating hospitals...');

  const hospitalA = await prisma.hospital.upsert({
    where: { email: 'hospitalA@bdms.com' },
    update: {},
    create: {
      name: 'Hospital A',
      address: '123 Main Street, Yangon',
      phone: '09111111111',
      email: 'hospitalA@bdms.com',
    },
  });

  const hospitalB = await prisma.hospital.upsert({
    where: { email: 'hospitalB@bdms.com' },
    update: {},
    create: {
      name: 'Hospital B',
      address: '456 Second Street, Mandalay',
      phone: '09222222222',
      email: 'hospitalB@bdms.com',
    },
  });

  console.log('ᡕᠵデᡁ᠊╾━ ✷ Creating accounts...');

  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordStaff = await bcrypt.hash('staff123', 10);
  const passwordUser = await bcrypt.hash('user123', 10);

  // ADMIN — Hospital A
  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@hospitalA.com' },
      update: {},
      create: {
        user_name: 'admin_hospitalA',
        email: 'admin@hospitalA.com',
        password: passwordAdmin,
        role_id: adminRole.id,
        hospital_id: hospitalA.id,
        is_active: true,
      },
    });

    // ADMIN — Hospital B
    await prisma.user.upsert({
      where: { email: 'admin@hospitalB.com' },
      update: {},
      create: {
        user_name: 'admin_hospitalB',
        email: 'admin@hospitalB.com',
        password: passwordAdmin,
        role_id: adminRole.id,
        hospital_id: hospitalB.id,
        is_active: true,
      },
    });
  }

  // STAFF — Hospital A
  if (staffRole) {
    await prisma.user.upsert({
      where: { email: 'staff@hospitalA.com' },
      update: {},
      create: {
        user_name: 'staff_hospitalA',
        email: 'staff@hospitalA.com',
        password: passwordStaff,
        role_id: staffRole.id,
        hospital_id: hospitalA.id,
        is_active: true,
      },
    });

    // STAFF — Hospital B
    await prisma.user.upsert({
      where: { email: 'staff@hospitalB.com' },
      update: {},
      create: {
        user_name: 'staff_hospitalB',
        email: 'staff@hospitalB.com',
        password: passwordStaff,
        role_id: staffRole.id,
        hospital_id: hospitalB.id,
        is_active: true,
      },
    });
  }

  // USER (donor) — Hospital A
  if (userRole) {
    await prisma.user.upsert({
      where: { email: 'user@hospitalA.com' },
      update: {},
      create: {
        user_name: 'user_hospitalA',
        email: 'user@hospitalA.com',
        password: passwordUser,
        role_id: userRole.id,
        hospital_id: hospitalA.id,
        is_active: true,
      },
    });

    // USER (donor) — Hospital B
    await prisma.user.upsert({
      where: { email: 'user@hospitalB.com' },
      update: {},
      create: {
        user_name: 'user_hospitalB',
        email: 'user@hospitalB.com',
        password: passwordUser,
        role_id: userRole.id,
        hospital_id: hospitalB.id,
        is_active: true,
      },
    });
  }

  console.log(
    '💀 Successfully seeded hospitals, roles, permissions and accounts.',
  );

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
