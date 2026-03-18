import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../config/config.helper';
import { DatabaseService } from '../../database/database.service';
import { RequestedUser } from 'src/common/interfaces/requested-user.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private appConfig: AppConfigService,
    private databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtRefreshSecret,
    });
  }

  async validate(payload: {
    sub: string;
    user_name: string;
    iat: number;
    exp: number;
  }): Promise<RequestedUser> {
    const user = await this.databaseService.user.findUnique({
      where: { id: payload.sub },
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
