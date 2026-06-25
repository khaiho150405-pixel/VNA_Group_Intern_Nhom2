import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportPeriod } from "./report-period.entity";
import { ReportPeriodService } from "./report-period.service";
import { ReportPeriodController } from "./report-period.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportPeriod]),
    AuthModule,
  ],
  controllers: [ReportPeriodController],
  providers: [ReportPeriodService],
  exports: [ReportPeriodService],
})
export class ReportPeriodModule {}
