import { Injectable } from '@nestjs/common';
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
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: import('passport-google-oauth20').Profile,
    done: VerifyCallback,
  ) {
    const { name, emails, id } = profile;
    const user = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
    };
    done(null, user);
  }
}
