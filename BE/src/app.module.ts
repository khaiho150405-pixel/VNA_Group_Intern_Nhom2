import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { dbOptions, load } from "./config";
import { AuthModule } from "./modules/auth/auth.module";
import { RoleModule } from "./modules/role/role.module";
import { UserModule } from "./modules/user/user.module";
import { ViewModule } from "./modules/view/view.module";
import { DoetModule } from "./modules/doet/doet.module";
import { LoaiHinhKinhDoanhModule } from "./modules/loai-hinh-kinh-doanh/loai-hinh-kinh-doanh.module";
import { BusinessLineModule } from "./modules/business-line/business-line.module";
import { UploadModule } from "./modules/upload/upload.module";
import { InjuryTypeModule } from "./modules/injury-type/injury-type.module";
import { InjuryFactorModule } from "./modules/injury-factor/injury-factor.module";
import { PeriodicReportModule } from "./modules/periodic-report/periodic-report.module";
import { ReportPeriodModule } from "./modules/report-period/report-period.module";
import { PermissionModule } from "./modules/permission/permission.module";
import { DomainMiddleware } from "./commons/middleware/domain.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ load: [load] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: dbOptions,
      inject: [ConfigService]
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
      serveStaticOptions: {
        index: false,
      },
    }),
    AuthModule,
    UserModule,
    RoleModule,
    ViewModule,
    DoetModule,
    LoaiHinhKinhDoanhModule,
    BusinessLineModule,
    UploadModule,
    InjuryTypeModule,
    InjuryFactorModule,
    PeriodicReportModule,
    ReportPeriodModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DomainMiddleware).forRoutes("*");
  }
}

