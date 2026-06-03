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
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest<any>();

      const jwt = req.headers['authorization']?.split(' ')[1];

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
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
