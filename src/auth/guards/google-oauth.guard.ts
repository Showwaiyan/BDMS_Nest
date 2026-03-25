import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const hospital_id = request.query.hospital_id;

    if (hospital_id && typeof hospital_id === 'string') {
      return {
        state: JSON.stringify({ hospital_id }),
      };
    }

    return {};
  }
}
