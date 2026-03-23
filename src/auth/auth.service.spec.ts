import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.helper';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findRoleByName: jest.Mock;
    create: jest.Mock;
    findByUsername: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    updatePassword: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    usersService = {
      findRoleByName: jest.fn(),
      create: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      updatePassword: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: AppConfigService,
          useValue: {
            jwtSecret: 'jwt-secret',
            jwtExpiresIn: '7d',
            jwtRefreshSecret: 'jwt-refresh-secret',
            jwtRefreshExpiresIn: '30d',
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create user with USER role', async () => {
      usersService.findRoleByName.mockResolvedValue({ id: 'role-user-id' });
      usersService.create.mockResolvedValue({ id: 'new-user-id' });

      const result = await service.register({
        user_name: 'john',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(usersService.findRoleByName).toHaveBeenCalledWith('USER');
      expect(usersService.create).toHaveBeenCalledWith({
        user_name: 'john',
        email: 'john@example.com',
        password: 'password123',
        role_id: 'role-user-id',
      });
      expect(result).toEqual({
        message: 'User registered successfully',
        data: { id: 'new-user-id' },
      });
    });

    it('should throw when USER role is missing', async () => {
      usersService.findRoleByName.mockResolvedValue(null);

      await expect(
        service.register({
          user_name: 'john',
          email: 'john@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const activeUser = {
      id: 'user-1',
      user_name: 'john',
      email: 'john@example.com',
      password: 'hashed-password',
      is_active: true,
      hospital_id: null,
      role: {
        name: 'USER',
        role_permissions: [
          { permission: { name: 'user.view' } },
          { permission: { name: 'donation.view' } },
        ],
      },
    };

    it('should throw for unknown username', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.login({ user_name: 'unknown', password: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw for inactive user', async () => {
      usersService.findByUsername.mockResolvedValue({
        ...activeUser,
        is_active: false,
      });

      await expect(
        service.login({ user_name: 'john', password: '123456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      usersService.findByUsername.mockResolvedValue(activeUser);
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        service.login({ user_name: 'john', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return tokens and user payload for valid credentials', async () => {
      usersService.findByUsername.mockResolvedValue(activeUser);
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        user_name: 'john',
        password: 'password123',
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Login successful',
        data: {
          user: {
            id: 'user-1',
            user_name: 'john',
            email: 'john@example.com',
            role: 'USER',
            hospital_id: undefined,
          },
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should issue new access and refresh tokens', async () => {
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        user_name: 'john',
        role: { name: 'USER', role_permissions: [] },
      });
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refreshToken('user-1');

      expect(result).toEqual({
        message: 'Token refreshed successfully',
        data: {
          access_token: 'new-access',
          refresh_token: 'new-refresh',
        },
      });
    });
  });

  describe('updatePassword', () => {
    it('should throw when current password does not match', async () => {
      usersService.findById.mockResolvedValue({ password: 'old-hash' });
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        service.updatePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when new password equals current password', async () => {
      usersService.findById.mockResolvedValue({ password: 'old-hash' });
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);

      await expect(
        service.updatePassword('user-1', {
          currentPassword: 'same-password',
          newPassword: 'same-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should hash and update password', async () => {
      usersService.findById.mockResolvedValue({ password: 'old-hash' });
      mockedBcrypt.compare.mockResolvedValueOnce(true as never);
      mockedBcrypt.hash.mockResolvedValueOnce('new-hash' as never);

      const result = await service.updatePassword('user-1', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      });

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-1',
        'new-hash',
      );
      expect(result).toEqual({ message: 'Password updated successfully' });
    });
  });
});
