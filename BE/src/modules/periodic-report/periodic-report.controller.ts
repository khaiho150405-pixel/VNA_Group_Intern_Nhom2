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
  async getDetail(@Param("id") id: string, @Request() req: any) {
    return await this.reportService.findDetail(+id, req.user);
  }

  @Get(":id/history")
  @ApiOperation({ summary: "Lấy lịch sử duyệt/từ chối của báo cáo" })
  async getHistory(@Param("id") id: string, @Request() req: any) {
    return await this.reportService.getHistory(+id, req.user);
  }

  @Get("history/year/:year")
  @ApiOperation({ summary: "Lấy lịch sử duyệt/từ chối của tất cả báo cáo trong năm" })
  async getYearHistory(@Param("year") year: string, @Request() req: any) {
    return await this.reportService.getYearHistory(+year, req.user);
  }

  @Post()
  @ApiOperation({ summary: "Tạo báo cáo mới" })
  async create(@Body() payload: any, @Request() req: any) {
    const user = req.user;
    if (user && (user.doet || user.doet_id)) {
      payload.doetId = user.doet || user.doet_id;
    } else {
      payload.doetId = 'testuser';
    }
    return await this.reportService.createReport(req.user, payload);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật báo cáo" })
  async update(@Param("id") id: string, @Body() payload: any, @Request() req: any) {
    return await this.reportService.put(req.user, id, payload);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa báo cáo" })
  async delete(@Param("id") id: string, @Request() req: any) {
    return await this.reportService.delete(req.user, id);
  }
}
