import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from 'src/commons/guards/localStrategy';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ViewModule } from '../view/view.module';

@Global()
@Module({
  imports: [
    UserModule,
    ViewModule,
    JwtModule.register({
      secret: '47213a34-365f-11ec-8d3d-0242ac130003',
      signOptions: { expiresIn: '1d', issuer: 'vna@group.com.vn' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
