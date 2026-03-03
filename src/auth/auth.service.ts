import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AppConfigService } from '../config/config.helper';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/logint.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private appConfig: AppConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);

    return {
      message: 'User registered successfully',
      data: user,
    };
  }

  async login(dto: LoginDto) {
    const user = (await this.usersService.findByUsername(dto.user_name)) as any;

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
          permissions: user.role.role_permissions.map((rp) => rp.permission.name),
        },
        ...tokens,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = (await this.usersService.findById(userId)) as any;

    const tokens = await this.generateTokens(
      user.id,
      user.user_name,
      user.role.name,
      user.role.role_permissions.map((rp: any) => rp.permission.name),
    );

    return {
      message: 'Token refreshed successfully',
      data: tokens,
    };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }

  private async generateTokens(
    userId: string,
    user_name: string,
    role: string,
    permissions: string[],
  ) {
    const payload = { sub: userId, user_name, role, permissions };

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
