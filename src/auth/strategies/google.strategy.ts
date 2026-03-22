import { Injectable, BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AppConfigService } from '../../config/config.helper';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private appConfig: AppConfigService) {
    super({
      clientID: appConfig.googleClientId || 'none',
      clientSecret: appConfig.googleClientSecret || 'none',
      callbackURL: appConfig.googleCallbackUrl || 'none',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: import('passport-google-oauth20').Profile,
    done: VerifyCallback,
  ) {
    const { emails, id } = profile;
    const { state } = req.query;

    let hospital_id: string | undefined;

    if (state) {
      try {
        const parsedState = JSON.parse(state);
        hospital_id = parsedState.hospital_id;
      } catch (e) {
        // Ignore
      }
    }

    if (!hospital_id) {
      return done(
        new BadRequestException('Hospital ID is required in OAuth state'),
        undefined,
      );
    }

    const user = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value ?? '',
      hospital_id,
    };
    done(null, user);
  }
}
