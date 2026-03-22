import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AppConfigService } from '../config/config.helper';
import { TokenBlacklistService } from './token-blacklist.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/logint.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../common/services/redis.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly RESET_PASSWORD_PREFIX = 'reset-password:';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private appConfig: AppConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    private mailService: MailService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // Find the default 'USER' role
    const userRole = await this.usersService.findRoleByName('USER');
    if (!userRole) {
      throw new InternalServerErrorException(
        'Default USER role not found in database. Please contact system administrator.',
      );
    }

    const user = await this.usersService.create({
      ...dto,
      role_id: userRole.id,
    });

    // Send welcome email (non-blocking)
    void this.mailService.sendWelcomeEmail(user.email, user.user_name);

    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmailInternal(dto.email);

    if (!user) {
      // Return success even if user doesn't exist for security (don't leak users)
      return {
        message:
          'If an account with that email exists, we have sent a password reset link.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetKey = `${this.RESET_PASSWORD_PREFIX}${resetToken}`;

    // Store in Redis with 1 hour TTL
    await this.redisService.set(resetKey, user.email, 3600);

    // TODO: Change this to your actual frontend reset link
    const resetLink = `http://localhost:3001/reset-password?token=${resetToken}`;

    void this.mailService.sendPasswordResetEmail(
      user.email,
      user.user_name,
      resetLink,
    );

    return {
      message:
        'If an account with that email exists, we have sent a password reset link.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetKey = `${this.RESET_PASSWORD_PREFIX}${dto.token}`;
    const email = await this.redisService.get(resetKey);

    if (!email) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmailInternal(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    // Delete the token
    await this.redisService.del(resetKey);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.user_name);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Please sign in using your previously linked OAuth provider.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.user_name,
      user.role.name,
      user.hospital_id ?? undefined,
    );

    // TODO: May Be: set refresh token in httpOnly cookie instead of returning in response body
    return {
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          user_name: user.user_name,
          email: user.email,
          role: user.role.name,
          hospital_id: user.hospital_id ?? undefined,
        },
        ...tokens,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);

    const tokens = await this.generateTokens(
      user.id,
      user.user_name,
      user.role.name,
      user.hospital_id ?? undefined,
    );

    return {
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  async validateOAuthLogin(profile: {
    providerId: string;
    email: string;
    provider: string;
  }) {
    let user = await this.usersService.findByProviderId(profile.providerId);

    if (!user) {
      user = await this.usersService.findByEmailInternal(profile.email);

      if (user) {
        // Link OAuth account to existing user by email
        user = await this.usersService.linkProvider(
          user.id,
          profile.provider,
          profile.providerId,
        );
      } else {
        // Create completely new user
        const userRole = await this.usersService.findRoleByName('USER');
        if (!userRole) {
          throw new InternalServerErrorException(
            'Default USER role not found in database. Please contact system administrator.',
          );
        }

        const usernamePrefix = profile.email.split('@')[0];
        const randomString = Math.random().toString(36).substring(2, 6);
        const autoUsername = `${usernamePrefix}_${randomString}`;

        const createdUserResult = await this.usersService.createOAuthUser({
          email: profile.email,
          user_name: autoUsername,
          provider: profile.provider,
          provider_id: profile.providerId,
          role_id: userRole.id,
        });

        user = await this.usersService.findById(createdUserResult.id);
      }
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.user_name,
      user.role.name,
      user.hospital_id ?? undefined,
    );

    return {
      message: 'OAuth login successful',
      data: {
        user: {
          id: user.id,
          user_name: user.user_name,
          email: user.email,
          role: user.role.name,
          hospital_id: user.hospital_id ?? undefined,
        },
        ...tokens,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.getMe(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      message: 'User profile retrieved successfully',
      data: user,
    };
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException(
        'You registered via an OAuth provider, please set a password first or continue using OAuth.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      message: 'Password updated successfully',
    };
  }

  async logout(
    accessToken: string,
    accessTokenExpiry: number,
    refreshToken?: string,
  ) {
    // Blacklist access token
    await this.tokenBlacklistService.blacklist(accessToken, accessTokenExpiry);

    // Blacklist refresh token if provided
    if (refreshToken) {
      try {
        const decoded = this.jwtService.decode<{ exp?: number }>(refreshToken);
        if (decoded?.exp) {
          await this.tokenBlacklistService.blacklist(refreshToken, decoded.exp);
        }
      } catch {
        // If refresh token decode fails, still proceed with access token blacklist
      }
    }

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateTokens(
    userId: string,
    user_name: string,
    role: string,
    hospital_id?: string,
  ) {
    const payload = { sub: userId, user_name, role, hospital_id };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.appConfig.jwtSecret,
        expiresIn: this.appConfig.jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.appConfig.jwtRefreshSecret,
        expiresIn: this.appConfig.jwtRefreshExpiresIn,
      }),
    ]);

    return { access_token, refresh_token };
  }
}
