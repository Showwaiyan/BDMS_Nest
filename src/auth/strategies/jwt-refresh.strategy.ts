import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AppConfigService } from '../../config/config.helper';
import { DatabaseService } from '../../database/database.service';
import { TokenBlacklistService } from '../token-blacklist.service';
import { RequestedUser } from '../../common/interfaces/requested-user.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private appConfig: AppConfigService,
    private databaseService: DatabaseService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: {
      sub: string;
      user_name: string;
      iat: number;
      exp: number;
    },
  ): Promise<RequestedUser> {
    // Extract and check if refresh token is blacklisted
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const isBlacklisted =
        await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }
    }
    const user = await this.databaseService.user.findFirst({
      where: {
        id: payload.sub,
        deleted_at: null,
      },
      select: {
        id: true,
        user_name: true,
        is_active: true,
        role: {
          select: {
            name: true,
            role_permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return fresh user data with current permissions from DB
    return {
      id: user.id,
      user_name: user.user_name,
      role: user.role.name,
      permissions: user.role.role_permissions.map((rp) => rp.permission.name),
    };
  }
}
