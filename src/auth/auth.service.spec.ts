import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.helper';
import { TokenBlacklistService } from './token-blacklist.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../common/services/redis.service';
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
    getMe: jest.Mock;
    updatePassword: jest.Mock;
    checkExistsByEmail: jest.Mock;
    checkExistsByUsername: jest.Mock;
    findByEmailInternal: jest.Mock;
    updateById: jest.Mock;
    findByProviderId: jest.Mock;
    linkProvider: jest.Mock;
    createOAuthUser: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    decode: jest.Mock;
  };
  let tokenBlacklistService: {
    blacklist: jest.Mock;
  };
  let mailService: {
    sendVerificationEmail: jest.Mock;
    sendWelcomeEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };
  let redisService: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    usersService = {
      findRoleByName: jest.fn(),
      create: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      getMe: jest.fn(),
      updatePassword: jest.fn(),
      checkExistsByEmail: jest.fn(),
      checkExistsByUsername: jest.fn(),
      findByEmailInternal: jest.fn(),
      updateById: jest.fn(),
      findByProviderId: jest.fn(),
      linkProvider: jest.fn(),
      createOAuthUser: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      decode: jest.fn(),
    };

    tokenBlacklistService = {
      blacklist: jest.fn(),
    };

    mailService = {
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    redisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
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
        {
          provide: TokenBlacklistService,
          useValue: tokenBlacklistService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should reject duplicate email in same hospital', async () => {
      usersService.checkExistsByEmail.mockResolvedValue({ id: 'u1' });

      await expect(
        service.register({
          user_name: 'john',
          email: 'john@example.com',
          password: 'password123',
          hospital_id: 'hosp-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create user with USER role and send verification link', async () => {
      usersService.checkExistsByEmail.mockResolvedValue(null);
      usersService.checkExistsByUsername.mockResolvedValue(null);
      usersService.findRoleByName.mockResolvedValue({ id: 'role-user-id' });
      usersService.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'john@example.com',
        user_name: 'john',
        hospital_id: 'hosp-1',
      });
      const result = await service.register({
        user_name: 'john',
        email: 'john@example.com',
        password: 'password123',
        hospital_id: 'hosp-1',
      });

      expect(usersService.findRoleByName).toHaveBeenCalledWith('USER');
      expect(usersService.create).toHaveBeenCalledWith({
        user_name: 'john',
        email: 'john@example.com',
        password: 'password123',
        role_id: 'role-user-id',
        hospital_id: 'hosp-1',
      });
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('verify-email:'),
        'john@example.com:hosp-1',
        86400,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual({
        id: 'new-user-id',
        user_name: 'john',
        email: 'john@example.com',
        hospital_id: 'hosp-1',
      });
    });

    it('should throw when USER role is missing', async () => {
      usersService.checkExistsByEmail.mockResolvedValue(null);
      usersService.checkExistsByUsername.mockResolvedValue(null);
      usersService.findRoleByName.mockResolvedValue(null);

      await expect(
        service.register({
          user_name: 'john',
          email: 'john@example.com',
          password: 'password123',
          hospital_id: 'hosp-1',
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('verifyEmail', () => {
    it('should throw for invalid/expired token', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should return already verified message', async () => {
      redisService.get.mockResolvedValue('john@example.com:hosp-1');
      usersService.findByEmailInternal.mockResolvedValue({
        id: 'user-1',
        email_verified_at: new Date(),
      });

      await expect(service.verifyEmail('good-token')).resolves.toEqual({
        message: 'Email already verified',
      });
    });
  });

  describe('resendVerification', () => {
    it('should return generic success for non-existing users', async () => {
      usersService.findByEmailInternal.mockResolvedValue(null);

      await expect(
        service.resendVerification('none@example.com', 'hosp-1'),
      ).resolves.toEqual({
        message:
          'If the account exists, a new verification link has been sent.',
      });
    });
  });

  describe('forgotPassword and resetPassword', () => {
    it('forgotPassword should return generic success for unknown users', async () => {
      usersService.findByEmailInternal.mockResolvedValue(null);

      await expect(
        service.forgotPassword({
          email: 'unknown@example.com',
          hospital_id: 'hosp-1',
        }),
      ).resolves.toEqual({
        message:
          'If an account with that email exists, we have sent a password reset link.',
        data: null,
      });
    });

    it('resetPassword should hash password and delete reset key', async () => {
      redisService.get.mockResolvedValue('john@example.com:hosp-1');
      usersService.findByEmailInternal.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        hospital_id: 'hosp-1',
      });
      mockedBcrypt.hash.mockResolvedValueOnce('new-hash' as never);

      const result = await service.resetPassword({
        token: 'reset-token',
        newPassword: 'new-password',
      });

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-1',
        'new-hash',
      );
      expect(redisService.del).toHaveBeenCalledWith(
        'reset-password:reset-token',
      );
      expect(result).toEqual({
        message: 'Password has been reset successfully',
        data: null,
      });
    });
  });

  describe('login', () => {
    const activeUser = {
      id: 'user-1',
      user_name: 'john',
      email: 'john@example.com',
      password: 'hashed-password',
      is_active: true,
      email_verified_at: new Date(),
      hospital_id: 'hosp-1',
      role: {
        name: 'USER',
        role_permissions: [{ permission: { name: 'user.view' } }],
      },
    };

    it('should throw for unknown username', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      await expect(
        service.login({
          user_name: 'unknown',
          password: '123456',
          hospital_id: 'hosp-1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw for unverified email', async () => {
      usersService.findByUsername.mockResolvedValue({
        ...activeUser,
        email_verified_at: null,
      });

      await expect(
        service.login({
          user_name: 'john',
          password: '123456',
          hospital_id: 'hosp-1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw for oauth-only user without password', async () => {
      usersService.findByUsername.mockResolvedValue({
        ...activeUser,
        password: null,
      });

      await expect(
        service.login({
          user_name: 'john',
          password: '123456',
          hospital_id: 'hosp-1',
        }),
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
        hospital_id: 'hosp-1',
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.data.access_token).toBe('access-token');
      expect(result.data.refresh_token).toBe('refresh-token');
    });
  });

  describe('refreshToken', () => {
    it('should issue new access and refresh tokens', async () => {
      usersService.findById.mockResolvedValue({
        id: 'user-1',
        user_name: 'john',
        role: { name: 'USER', role_permissions: [] },
        hospital_id: 'hosp-1',
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

  describe('validateOAuthLogin', () => {
    it('should link existing account found by email', async () => {
      usersService.findByProviderId.mockResolvedValue(null);
      usersService.findByEmailInternal.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        user_name: 'john',
        email_verified_at: new Date(),
        is_active: true,
        hospital_id: 'hosp-1',
        role: { name: 'USER', role_permissions: [] },
      });
      usersService.linkProvider.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        user_name: 'john',
        email_verified_at: new Date(),
        is_active: true,
        hospital_id: 'hosp-1',
        role: { name: 'USER', role_permissions: [] },
      });
      jwtService.signAsync
        .mockResolvedValueOnce('oauth-access')
        .mockResolvedValueOnce('oauth-refresh');

      const result = await service.validateOAuthLogin(
        {
          providerId: 'google-123',
          email: 'john@example.com',
          provider: 'google',
        },
        'hosp-1',
      );

      expect(usersService.linkProvider).toHaveBeenCalledWith(
        'user-1',
        'google',
        'google-123',
      );
      expect(result.data.access_token).toBe('oauth-access');
    });
  });

  describe('getMe', () => {
    it('should throw when no profile found', async () => {
      usersService.getMe.mockResolvedValue({ data: null });

      await expect(service.getMe('user-1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
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

    it('should throw for oauth-only account', async () => {
      usersService.findById.mockResolvedValue({ password: null });

      await expect(
        service.updatePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'new-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should blacklist access and refresh tokens when refresh exp exists', async () => {
      jwtService.decode.mockReturnValue({ exp: 123456 });

      const result = await service.logout(
        'access-token',
        999999,
        'refresh-token',
      );

      expect(tokenBlacklistService.blacklist).toHaveBeenNthCalledWith(
        1,
        'access-token',
        999999,
      );
      expect(tokenBlacklistService.blacklist).toHaveBeenNthCalledWith(
        2,
        'refresh-token',
        123456,
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
