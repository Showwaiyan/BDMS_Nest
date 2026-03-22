import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // App
  get port(): number {
    return this.configService.get<number>('app.port')!;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('app.nodeEnv')!;
  }

  get appName(): string {
    return this.configService.get<string>('app.name')!;
  }

  // Database
  get databaseUrl(): string {
    return this.configService.get<string>('database.url')!;
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret')!;
  }

  get jwtExpiresIn(): StringValue {
    return (this.configService.get<string>('jwt.expiresIn') ||
      '7d') as StringValue;
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret')!;
  }

  get jwtRefreshExpiresIn(): StringValue {
    return (this.configService.get<string>('jwt.refreshExpiresIn') ||
      '30d') as StringValue;
  }

  // Redis
  get upstashRedisRestUrl(): string | undefined {
    return this.configService.get<string>('redis.restUrl');
  }

  get upstashRedisRestToken(): string | undefined {
    return this.configService.get<string>('redis.restToken');
  }
}
