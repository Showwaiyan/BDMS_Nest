import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

describe('Auth & Multi-Tenancy (Integration)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let hospitalAId: string;
  let hospitalBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(DatabaseService);

    // Get seeded hospital IDs
    const hospitals = await prisma.hospital.findMany();
    hospitalAId = hospitals.find((h) => h.name === 'Hospital A')?.id;
    hospitalBId = hospitals.find((h) => h.name === 'Hospital B')?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Multi-Hospital Registration', () => {
    it('should allow registering the same email in different hospitals', async () => {
      const ts = Date.now();
      const userData = {
        user_name: `multi_tenant_user_${ts}`,
        email: `shared_${ts}@example.com`,
        password: 'password123',
      };

      // Register in Hospital A
      const resA = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...userData, hospital_id: hospitalAId });

      expect(resA.status).toBe(201);

      // Register in Hospital B with SAME email
      const resB = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...userData,
          hospital_id: hospitalBId,
          user_name: `multi_tenant_user_2_${ts}`,
        });

      expect(resB.status).toBe(201);
    });

    it('should prevent duplicate email within the SAME hospital', async () => {
      const userData = {
        user_name: `duplicate_user_${Date.now()}`,
        email: `duplicate_${Date.now()}@hospital-a.com`,
        password: 'password123',
        hospital_id: hospitalAId,
      };

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(userData);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...userData, user_name: 'different_name' });

      expect(res.status).toBe(400); // Bad Request (from our new validation)
      expect(res.body.message).toContain('Email already registered');
    });
  });

  describe('Cross-Hospital Security', () => {
    let adminAToken: string;
    let adminBToken: string;

    beforeAll(async () => {
      // Login as Admin A (Seeded: admin@hospitalA.com / admin123)
      // Note: We need to make sure email_verified_at is set for seeded users in the test DB
      await prisma.user.updateMany({
        where: { email_verified_at: null },
        data: { email_verified_at: new Date() },
      });

      const loginA = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          user_name: 'admin_hospitalA',
          password: 'admin123',
          hospital_id: hospitalAId,
        });
      adminAToken = loginA.body.data.access_token;

      const loginB = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          user_name: 'admin_hospitalB',
          password: 'admin123',
          hospital_id: hospitalBId,
        });
      adminBToken = loginB.body.data.access_token;
    });

    it('should only return staff from the admins own hospital', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/staff')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      const staff = res.body.data.data;

      // Verify all returned staff belong to Hospital A
      staff.forEach((member: any) => {
        expect(member.hospital_id).toBe(hospitalAId);
      });
    });

    it('should prevent Admin A from accessing details of a user in Hospital B', async () => {
      // Find a user in Hospital B
      const userB = await prisma.user.findFirst({
        where: { hospital_id: hospitalBId, user_name: 'staff_hospitalB' },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${userB?.id}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      // CURRENTLY FAILS: Returns 200 because hospital scoping isn't in findOne yet!
      expect(res.status).toBe(403);
    });
  });
});
