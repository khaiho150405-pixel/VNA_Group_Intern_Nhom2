import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PeriodicReport } from "./periodic-report.entity";
import { AccidentDetail } from "./accident-detail.entity";
import { Doet } from "../doet/doet.entity";
import { PeriodicReportService } from "./periodic-report.service";
import { PeriodicReportController } from "./periodic-report.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PeriodicReport, AccidentDetail, Doet])],
  controllers: [PeriodicReportController],
  providers: [PeriodicReportService],
  exports: [PeriodicReportService],
})
export class PeriodicReportModule {}
