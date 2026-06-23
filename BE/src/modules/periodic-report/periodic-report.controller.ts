import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor, Request } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "src/commons/guards/authGuard";
import { ResponseInterceptor } from "src/commons";
import { PeriodicReportService } from "./periodic-report.service";

@ApiTags("Periodic Reports - Báo cáo TNLĐ định kỳ")
@Controller("periodic-reports")
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
export class PeriodicReportController {
  constructor(private readonly reportService: PeriodicReportService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách báo cáo" })
  async getList(@Query() query: any, @Request() req: any) {
    return await this.reportService.findAllReports(req.user, query);
  }

  @Get("summary")
  @ApiOperation({ summary: "Lấy báo cáo tổng hợp tình hình TNLĐ" })
  async getSummary(@Query() query: any, @Request() req: any) {
    return await this.reportService.getSummaryReport(req.user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết báo cáo" })
  async getDetail(@Param("id") id: string) {
    return await this.reportService.findDetail(+id);
  }

  @Post()
  @ApiOperation({ summary: "Tạo báo cáo mới" })
  async create(@Body() payload: any, @Request() req: any) {
    const user = req.user;
    if (user && user.doet) {
      payload.doetId = user.doet;
    } else {
      payload.doetId = 'testuser';
    }
    return await this.reportService.createReport(payload);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật báo cáo" })
  async update(@Param("id") id: string, @Body() payload: any, @Request() req: any) {
    return await this.reportService.put(req.user, id, payload);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa báo cáo" })
  async delete(@Param("id") id: string) {
    return await this.reportService.delete(null, id);
  }
}
