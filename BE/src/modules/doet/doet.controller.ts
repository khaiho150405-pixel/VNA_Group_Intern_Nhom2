import { Body, ClassSerializerInterceptor, Controller, Get, Param, Post, Query, Request, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BaseController, ResponseData, ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { Doet } from "./doet.entity";
import { DoetService } from "./doet.service";
import { KeyValue } from "../../commons/bases/baseAddressEntity";
import { ChangePasswordDto } from "./change-password.dto";
import { ResetPasswordDto } from "./reset-password.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import Response from "../../commons/response";

@ApiTags("Doets")
@Controller("doets")
@UseGuards(AuthGuard)
export class DoetController extends BaseController<Doet, DoetService> {
  constructor(private readonly doetService: DoetService) {
    super(doetService);
  }

  @Post("import")
  @UseInterceptors(FileInterceptor("file"))
  @ApiOperation({ summary: "Import doanh nghiệp từ file Excel" })
  async import(@Request() req: any, @UploadedFile() file: any) {
    return await this.doetService.importExcel(req.user, file.buffer);
  }

  @Get("my-company")
  @ApiOperation({ summary: "Doanh nghiệp tự lấy thông tin của chính mình" })
  async getMyCompany(@Request() req) {
    return await this.doetService.getMyCompany(req.user);
  }

  @Post("my-company")
  @ApiOperation({ summary: "Doanh nghiệp tự cập nhật thông tin của chính mình" })
  async updateMyCompany(@Request() req, @Body() body: any) {
    return await this.doetService.updateMyCompany(req.user, body);
  }

  @Get("wards/distinct")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách phường/xã đã có trong dữ liệu doanh nghiệp" })
  async getDistinctWards() {
    const data = await this.doetService.getDistinctWards();
    return Response.get(data);
  }

  @Get("check-email")
  @ApiOperation({ summary: "Kiểm tra email đã tồn tại trong hệ thống" })
  async checkEmail(@Query("email") email: string, @Query("id") id?: string) {
    return await this.doetService.checkEmailExists(email, id ? Number(id) : undefined);
  }

    @Get()
  async getAll(@Query() query: any): Promise<any> {
    return await this.doetService.findWithFilters(query);
  }

  @Get("/setting")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy thông tin cấu hình doanh nghiệp" })
  async getSetting(
    @Request() req
  ): Promise<any> {
    return await this.doetService.getSetting(req.doet);
  }

  @Post("/setting")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Cập nhật thông tin cấu hình doanh nghiệp" })
  async updateSetting(
    @Request() req,
    @Body("name") name: string,
    @Body("logo") logo: string,
    @Body("favicon") favicon: string,
    @Body("province") province: KeyValue
  ): Promise<any> {
    return await this.doetService.updateSetting(req.doet, name, logo, favicon, province);
  }

  @Post("send-otp")
  @ApiOperation({ summary: "Gửi OTP đổi mật khẩu cho doanh nghiệp" })
  async sendOtp(@Body("email") email: string) {
    return await this.doetService.sendOtp(email);
  }

  @Post(":id/change-password")
  @ApiOperation({ summary: "Đổi mật khẩu doanh nghiệp" })
  async changePassword(@Param("id") id: string, @Body() body: ChangePasswordDto) {
    return await this.doetService.changePassword(Number(id), body.oldPassword, body.otp, body.newPassword);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Quên mật khẩu doanh nghiệp (Reset bằng OTP)" })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.doetService.resetPassword(body.email, body.otp, body.newPassword);
  }

  @Post(":id/admin-reset-password")
  @ApiOperation({ summary: "Admin cấp lại mật khẩu cho doanh nghiệp" })
  async adminResetPassword(@Param("id") id: string, @Body("newPassword") newPassword: string) {
    return await this.doetService.adminResetPassword(Number(id), newPassword);
  }
}
