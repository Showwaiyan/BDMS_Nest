import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { hospital_id } = request.query;

    if (hospital_id) {
      return {
        state: JSON.stringify({ hospital_id }),
      };
    }

    return {};
  }
}
