import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: {
    role: { findUnique: jest.Mock };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    databaseService = {
      role: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findRoleByName', () => {
    it('should query role by name', async () => {
      databaseService.role.findUnique.mockResolvedValue({ id: 'role-1' });

      const result = await service.findRoleByName('USER');

      expect(databaseService.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'USER' },
      });
      expect(result).toEqual({ id: 'role-1' });
    });
  });

  describe('findById', () => {
    it('should throw when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return user when found', async () => {
      const user = { id: 'user-1' };
      databaseService.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result).toBe(user);
    });
  });

  describe('create', () => {
    it('should throw when username already exists', async () => {
      databaseService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(
        service.create({
          user_name: 'john',
          email: 'john@example.com',
          password: 'password123',
          role_id: 'role-1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should hash password and create user', async () => {
      databaseService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValueOnce('hashed-password' as never);
      databaseService.user.create.mockResolvedValue({ id: 'user-1' });

      const result = await service.create({
        user_name: 'john',
        email: 'john@example.com',
        password: 'password123',
        role_id: 'role-1',
      });

      expect(databaseService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_name: 'john',
            email: 'john@example.com',
            password: 'hashed-password',
            role_id: 'role-1',
          }),
        }),
      );
      expect(result).toEqual({ id: 'user-1' });
    });
  });

  describe('updateUserRole', () => {
    it('should throw when role does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      databaseService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserRole('user-1', 'STAFF'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should update user role successfully', async () => {
      databaseService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      databaseService.role.findUnique.mockResolvedValue({ id: 'role-staff' });
      databaseService.user.update.mockResolvedValue({
        id: 'user-1',
        role_id: 'role-staff',
      });

      const result = await service.updateUserRole('user-1', 'STAFF');

      expect(databaseService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { role_id: 'role-staff' },
        }),
      );
      expect(result).toEqual({
        message: 'User role updated successfully',
        data: { id: 'user-1', role_id: 'role-staff' },
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      databaseService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        is_active: true,
      });
      databaseService.user.update.mockResolvedValue({
        id: 'user-1',
        is_active: false,
      });

      const result = await service.toggleActive('user-1');

      expect(databaseService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { is_active: false },
        }),
      );
      expect(result).toEqual({
        message: 'User deactivated successfully',
        data: { id: 'user-1', is_active: false },
      });
    });
  });

  describe('remove', () => {
    it('should delete existing user', async () => {
      databaseService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      databaseService.user.delete.mockResolvedValue({ id: 'user-1' });

      const result = await service.remove('user-1');

      expect(databaseService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({
        message: 'User deleted successfully',
        data: null,
      });
    });
  });
});
