import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.helper';
import type { Request } from 'express';
import type { RequestedUser } from '../common/interfaces/requested-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    verifyEmail: jest.Mock;
    resendVerification: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
    login: jest.Mock;
    validateOAuthLogin: jest.Mock;
    refreshToken: jest.Mock;
    getMe: jest.Mock;
    updatePassword: jest.Mock;
    logout: jest.Mock;
  };
  let jwtService: {
    decode: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerification: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      login: jest.fn(),
      validateOAuthLogin: jest.fn(),
      refreshToken: jest.fn(),
      getMe: jest.fn(),
      updatePassword: jest.fn(),
      logout: jest.fn(),
    };

    jwtService = {
      decode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: AppConfigService,
          useValue: { frontendUrl: 'http://localhost:3001' },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should forward dto to authService', async () => {
    const dto = {
      user_name: 'john',
      email: 'john@example.com',
      password: 'password123',
      hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    };
    authService.register.mockResolvedValue({ message: 'ok' });

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('verifyEmail should pass query token', async () => {
    authService.verifyEmail.mockResolvedValue({ message: 'verified' });

    await controller.verifyEmail('token-123');

    expect(authService.verifyEmail).toHaveBeenCalledWith('token-123');
  });

  it('resendVerification should map dto args', async () => {
    authService.resendVerification.mockResolvedValue({ message: 'sent' });

    await controller.resendVerification({
      email: 'john@example.com',
      hospital_id: 'hosp-1',
    });

    expect(authService.resendVerification).toHaveBeenCalledWith(
      'john@example.com',
      'hosp-1',
    );
  });

  it('login should forward dto', async () => {
    const dto = { user_name: 'john', password: 'pass', hospital_id: 'hosp-1' };
    authService.login.mockResolvedValue({ message: 'ok' });

    await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('refresh should pass current user id', async () => {
    authService.refreshToken.mockResolvedValue({ message: 'ok' });

    const mockUser: RequestedUser = {
      id: 'user-1',
      user_name: 'testuser',
      role: 'user',
      permissions: [],
    };

    await controller.refresh(mockUser);

    expect(authService.refreshToken).toHaveBeenCalledWith('user-1');
  });

  it('getProfile should pass current user id', async () => {
    authService.getMe.mockResolvedValue({ message: 'ok' });

    const mockUser: RequestedUser = {
      id: 'user-1',
      user_name: 'testuser',
      role: 'user',
      permissions: [],
    };

    await controller.getProfile(mockUser);

    expect(authService.getMe).toHaveBeenCalledWith('user-1');
  });

  it('logout should decode bearer and call authService.logout when exp exists', async () => {
    jwtService.decode.mockReturnValue({ exp: 12345 });
    authService.logout.mockResolvedValue({
      message: 'Logged out successfully',
    });
    const req = {
      headers: { authorization: 'Bearer access-token' },
    } as Request;

    await controller.logout(req, { refreshToken: 'refresh-token' });

    expect(authService.logout).toHaveBeenCalledWith(
      'access-token',
      12345,
      'refresh-token',
    );
  });
});
