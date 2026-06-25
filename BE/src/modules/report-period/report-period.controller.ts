import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "src/commons/guards/authGuard";
import { ResponseInterceptor } from "src/commons";
import { ReportPeriodService } from "./report-period.service";

@ApiTags("Report Periods - Cấu hình Kỳ báo cáo")
@Controller("report-periods")
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
export class ReportPeriodController {
  constructor(private readonly reportPeriodService: ReportPeriodService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách kỳ báo cáo" })
  async getList(@Query() query: any) {
    return await this.reportPeriodService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết kỳ báo cáo" })
  async getDetail(@Param("id") id: string) {
    return await this.reportPeriodService.findById(+id);
  }

  @Post()
  @ApiOperation({ summary: "Tạo kỳ báo cáo mới" })
  async create(@Body() payload: any) {
    return await this.reportPeriodService.create(payload);
  }

  @Put(":id")
  @ApiOperation({ summary: "Cập nhật kỳ báo cáo" })
  async update(@Param("id") id: string, @Body() payload: any) {
    return await this.reportPeriodService.update(+id, payload);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa kỳ báo cáo" })
  async delete(@Param("id") id: string) {
    return await this.reportPeriodService.remove(+id);
  }
}
