import { Body, ClassSerializerInterceptor, Controller, Get, Param, Post, Query, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BaseController, ResponseData, ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { Doet } from "./doet.entity";
import { DoetService } from "./doet.service";
import { KeyValue } from "../../commons/bases/baseAddressEntity";
import { ChangePasswordDto } from "./change-password.dto";
import { ResetPasswordDto } from "./reset-password.dto";

@ApiTags("Doets")
@Controller("doets")
@UseGuards(AuthGuard)
export class DoetController extends BaseController<Doet, DoetService> {
  constructor(private readonly doetService: DoetService) {
    super(doetService);
  }

  @Get()
  async getAll(@Query() query: any): Promise<any> {
    return await this.doetService.findWithFilters(query);
  }

  @Get("/setting")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Update setting" })
  async getSetting(
    @Request() req
  ): Promise<any> {
    return await this.doetService.getSetting(req.doet);
  }

  @Post("/setting")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get setting" })
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
}
