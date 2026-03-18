import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../../database/database.service';
import { AppConfigService } from '../../config/config.helper';
import { RequestedUser } from 'src/common/interfaces/requested-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private databaseService: DatabaseService,
    private appConfig: AppConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret,
    });
  }

  async validate(payload: {
    sub: string;
    user_name: string;
    role: string;
    permissions: string[];
    hospital_id?: string;
  }): Promise<RequestedUser> {
    const user = await this.databaseService.user.findUnique({
      where: { id: payload.sub },
      select: {
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: payload.sub,
      user_name: payload.user_name,
      role: payload.role,
      permissions: payload.permissions,
      hospital_id: payload.hospital_id,
    };
  }
}
