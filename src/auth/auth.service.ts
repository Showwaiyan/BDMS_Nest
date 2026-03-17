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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/logint.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private appConfig: AppConfigService,
  ) { }

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

    return {
      message: 'User registered successfully',
      data: user,
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.user_name,
      user.role.name,
      user.role.role_permissions.map((rp) => rp.permission.name),
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
          permissions: user.role.role_permissions.map(
            (rp) => rp.permission.name,
          ),
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
      user.role.role_permissions.map((rp) => rp.permission.name),
    );

    return {
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
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

  private async generateTokens(
    userId: string,
    user_name: string,
    role: string,
    permissions: string[],
    hospital_id?: string,
  ) {
    const payload = { sub: userId, user_name, role, permissions, hospital_id };

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
