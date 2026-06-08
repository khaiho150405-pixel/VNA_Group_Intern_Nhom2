import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';

import { QueryFailedError } from 'typeorm';
import {
  BadRequestException,
  FieldDuplicatedException,
  ForBiddenException,
  InternalServerException,
  UnAuthorizedException,
} from '..';

@Catch()
export class ServiceErrorsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.error(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    Logger.error('>>>>throw exception: ', exception);
    if (exception instanceof BadRequestException) {
      return response.status(exception.status).json({
        ...exception,
      });
    } else if (exception instanceof ForBiddenException) {
      return response.status(exception.status).json({
        ...exception,
      });
    } else if (exception instanceof UnAuthorizedException) {
      return response.status(exception.status).json({
        ...exception,
      });
    } else if (exception instanceof QueryFailedError) {
      if ((exception as any)?.code === '23505') {
        const fields = (exception as any).detail.split('');
        const badRequestException = new FieldDuplicatedException(
          {
            name: exception?.name,
            message: exception?.message,
            code: (exception as any)?.code,
            detail: (exception as any)?.detail,
          },
          (exception as any)?.detail,
        );
        return response.status(badRequestException.status).json({
          ...badRequestException,
        });
      } else {
        const internalError = new InternalServerException({
          name: exception?.name,
          message: exception?.message,
          code: (exception as any)?.code,
          detail: (exception as any)?.detail,
        });
        return response.status(internalError.status).json({
          ...internalError,
        });
      }
    } else if (exception?.status === 400) {
      const badRequestException = new BadRequestException(exception?.response);
      return response.status(badRequestException.status).json({
        ...badRequestException,
      });
    } else {
      const internalError = new InternalServerException(exception?.message);
      return response.status(internalError.status).json({
        ...internalError,
      });
    }
  }
}
