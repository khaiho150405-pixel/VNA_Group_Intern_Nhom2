import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';
import Response from '../response';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest<any>();

      const authHeader = req.headers['authorization'];
      const jwt = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

      if (!jwt) {
        throw Response.errorBad(Response.WRONG_TOKEN);
      }

      const rs = await this.authService.validateToken(jwt, req.doet);

      Logger.debug(
        `Method=${req.method} --- Url: ${req.url} - User: ${rs.data.user.fullName}`,
      );

      if (false) {
        throw Response.errorForBidden(Response.PERMISSION);
      }

      Object.assign(req, rs.data);
      return true;
    } catch (error: any) {
      if (error && error.status) {
        throw error;
      }
      throw Response.errorInternal(error);
    }
  }
}
