import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseInterface<AppResponse> {}

@Injectable()
export class ResponseInterceptor<AppResponse>
   implements NestInterceptor<AppResponse, ResponseInterface<AppResponse>>
{
   intercept(
      context: ExecutionContext,
      next: CallHandler
   ): Observable<ResponseInterface<AppResponse>> {
      return next.handle().pipe(
         map((item) => {
            return {
               ...item,
               data: classToPlain(item?.data)
            };
         })
      );
   }
}
