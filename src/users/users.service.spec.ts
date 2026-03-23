import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: {
    findRoleByName: jest.Mock;
    findByUsername: jest.Mock;
    findById: jest.Mock;
    findPublicById: jest.Mock;
    checkExistsByUsername: jest.Mock;
    checkExistsByEmail: jest.Mock;
    create: jest.Mock;
    findManyByCriteria: jest.Mock;
    count: jest.Mock;
    updateById: jest.Mock;
    updatePassword: jest.Mock;
    softDelete: jest.Mock;
  };
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    usersRepo = {
      findRoleByName: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findPublicById: jest.fn(),
      findProfileById: jest.fn(),
      checkExistsByUsername: jest.fn(),
      checkExistsByEmail: jest.fn(),
      create: jest.fn(),
      findManyByCriteria: jest.fn(),
      count: jest.fn(),
      updateById: jest.fn(),
      updatePassword: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: usersRepo,
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
      usersRepo.findRoleByName.mockResolvedValue({ id: 'role-1' });

      await expect(service.findRoleByName('USER')).resolves.toEqual({
        id: 'role-1',
      });

      expect(usersRepo.findRoleByName).toHaveBeenCalledWith('USER');
    });
  });

  describe('findById', () => {
    it('should throw when user does not exist', async () => {
      usersRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return user when found', async () => {
      const user = { id: 'user-1' };
      usersRepo.findById.mockResolvedValue(user);

      await expect(service.findById('user-1')).resolves.toEqual(user);
    });
  });

  describe('findOne', () => {
    it('should throw when user is from a different hospital', async () => {
      usersRepo.findProfileById.mockResolvedValue({
        id: 'user-1',
        hospital_id: 'hosp-2',
      });

      await expect(service.findOne('user-1', 'hosp-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return user when found in same hospital', async () => {
      const user = { id: 'user-1', hospital_id: 'hosp-1' };
      usersRepo.findProfileById.mockResolvedValue(user);

      await expect(service.findOne('user-1', 'hosp-1')).resolves.toEqual({
        message: 'User fetched successfully',
        data: user,
      });
    });
  });

  describe('create', () => {
    it('should throw when username already exists', async () => {
      usersRepo.checkExistsByUsername.mockResolvedValue({
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

    it('should throw when email already exists', async () => {
      usersRepo.checkExistsByUsername.mockResolvedValue(null);
      usersRepo.checkExistsByEmail.mockResolvedValue({ id: 'existing-user' });

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
      usersRepo.checkExistsByUsername.mockResolvedValue(null);
      usersRepo.checkExistsByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValueOnce('hashed-password' as never);
      usersRepo.create.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.create({
          user_name: 'john',
          email: 'john@example.com',
          password: 'password123',
          role_id: 'role-1',
        }),
      ).resolves.toEqual({ id: 'user-1' });

      expect(usersRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should throw when no fields are provided', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        user_name: 'john',
        email: 'john@example.com',
      });

      await expect(service.update('user-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw when username is already taken', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        user_name: 'john',
        email: 'john@example.com',
      });
      usersRepo.checkExistsByUsername.mockResolvedValue({ id: 'other-user' });

      await expect(
        service.update('user-1', { user_name: 'existing-name' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should update email and username', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        user_name: 'john',
        email: 'john@example.com',
      });
      usersRepo.checkExistsByUsername.mockResolvedValue(null);
      usersRepo.checkExistsByEmail.mockResolvedValue(null);
      usersRepo.updateById.mockResolvedValue({
        id: 'user-1',
        user_name: 'johnny',
        email: 'johnny@example.com',
      });

      await expect(
        service.update('user-1', {
          user_name: 'johnny',
          email: 'johnny@example.com',
        }),
      ).resolves.toEqual({
        message: 'User updated successfully',
        data: {
          id: 'user-1',
          user_name: 'johnny',
          email: 'johnny@example.com',
        },
      });
    });
  });

  describe('updateUserRole', () => {
    it('should throw when role does not exist', async () => {
      usersRepo.findById.mockResolvedValue({ id: 'user-1' });
      usersRepo.findRoleByName.mockResolvedValue(null);

      await expect(
        service.updateUserRole('user-1', 'STAFF'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should update user role successfully', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        hospital_id: 'hosp-1',
      });
      usersRepo.findRoleByName.mockResolvedValue({ id: 'role-staff' });
      usersRepo.updateById.mockResolvedValue({
        id: 'user-1',
        role_id: 'role-staff',
      });

      await expect(
        service.updateUserRole('user-1', 'hosp-1', 'STAFF'),
      ).resolves.toEqual({
        message: 'User role updated successfully',
        data: { id: 'user-1', role_id: 'role-staff' },
      });

      expect(usersRepo.updateById).toHaveBeenCalledWith('user-1', {
        role_id: 'role-staff',
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        hospital_id: 'hosp-1',
        is_active: true,
      });
      usersRepo.updateById.mockResolvedValue({
        id: 'user-1',
        is_active: false,
      });

      await expect(service.toggleActive('user-1', 'hosp-1')).resolves.toEqual({
        message: 'User deactivated successfully',
        data: { id: 'user-1', is_active: false },
      });

      expect(usersRepo.updateById).toHaveBeenCalledWith('user-1', {
        is_active: false,
      });
    });
  });

  describe('remove', () => {
    it('should soft delete existing user', async () => {
      usersRepo.findById.mockResolvedValue({
        id: 'user-1',
        hospital_id: 'hosp-1',
      });
      usersRepo.softDelete.mockResolvedValue({ id: 'user-1' });

      await expect(service.remove('user-1', 'hosp-1')).resolves.toEqual({
        message: 'User deleted successfully',
        data: null,
      });

      expect(usersRepo.softDelete).toHaveBeenCalledWith('user-1');
    });
  });
});
