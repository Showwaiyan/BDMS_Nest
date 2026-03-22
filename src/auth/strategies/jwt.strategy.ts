import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { DatabaseService } from '../../database/database.service';
import { AppConfigService } from '../../config/config.helper';
import { RequestedUser } from 'src/common/interfaces/requested-user.interface';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private databaseService: DatabaseService,
    private appConfig: AppConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: {
      sub: string;
      user_name: string;
      role: string;
      hospital_id?: string;
      iat: number;
      exp: number;
    },
  ): Promise<RequestedUser> {
    // Extract token from Authorization header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token is blacklisted
    if (token && (await this.tokenBlacklistService.isBlacklisted(token))) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.databaseService.user.findFirst({
      where: {
        id: payload.sub,
        deleted_at: null,
      },
      select: {
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

    const effectivePermissions = user.role.role_permissions.map(
      (rp) => rp.permission.name,
    );

    return {
      id: payload.sub,
      user_name: payload.user_name,
      role: user.role.name,
      permissions: effectivePermissions,
      hospital_id: payload.hospital_id,
    };
  }
}
