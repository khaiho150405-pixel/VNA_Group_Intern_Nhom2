import {
  ClassSerializerInterceptor,
  Controller,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  Body, Req, Get, Query,
  BadRequestException
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseData, ResponseInterceptor } from "src/commons";
import { LocalAuthGuard } from "src/commons/guards/localAuthGuard";
import { AuthGuard } from "src/commons/guards/authGuard";
import { LoginModel } from "./auth.model";
import { AuthService } from "./auth.service";

import { LoaiHinhKinhDoanhService } from "../loai-hinh-kinh-doanh/loai-hinh-kinh-doanh.service";
import { BusinessLineService } from "../business-line/business-line.service";
import Response from "../../commons/response";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loaiHinhKinhDoanhService: LoaiHinhKinhDoanhService,
    private readonly businessLineService: BusinessLineService
  ) {
  }

  @Get("public/loai-hinh-kinh-doanh")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get active Loai Hinh Kinh Doanh (Public)" })
  async getPublicLoaiHinhKinhDoanh() {
    const data = await this.loaiHinhKinhDoanhService.getActiveForDropdown();
    return Response.get(data);
  }

  @Get("public/business-lines")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get active Business Lines (Public)" })
  async getPublicBusinessLines() {
    const data = await this.businessLineService.getActiveLevel4ForDropdown();
    return Response.get(data);
  }

  @Post("register/send-otp")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Send OTP for enterprise registration"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" }
      }
    }
  })
  async registerSendOtp(
    @Body("email") email: string
  ): Promise<any> {
    return this.authService.sendRegistrationOtp(email);
  }

  @Post("register")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Register new enterprise with OTP"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        otp: { type: "string", example: "123456" },
        payload: { type: "object" }
      }
    }
  })
  async register(
    @Body("otp") otp: string,
    @Body() payload: any
  ): Promise<any> {
    return this.authService.registerEnterprise(payload, otp);
  }

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Login with username and password"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: { type: "string", example: "testuser" },
        password: { type: "string", example: "1" }
      }
    }
  })
  async login(@Request() req: any): Promise<ResponseData<LoginModel>> {
    return this.authService.login(req.user, req.doet);
  }

  @Get("check-email")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Check if email exists in the system (public, no auth required)"
  })
  async checkEmail(
    @Query("email") email: string
  ): Promise<{ email: string; existed: boolean }> {
    return this.authService.checkEmailExists(email);
  }

  @Post("forgot-password")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "forgot password"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" }
      }
    }
  })
  async forgotPasswrod(
    @Body("email") email: string,
    @Req() req: any
  ): Promise<any> {
    const domain = req.get("origin") || req.get("host");
    return this.authService.forgotPassword(email, domain);
  }

  @Post("reset-password")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "reset password"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        otp: { type: "string", example: "123456" },
        password: { type: "string", example: "newpassword123" }
      }
    }
  })
  async resetPassword(
    @Body("email") email: string,
    @Body("otp") otp: string,
    @Body("password") passwordNew: string
  ): Promise<any> {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(passwordNew)) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái thường, chữ hoa và số');
    }
    return this.authService.resetPassword(email, otp, passwordNew);
  }

  @Post("change-password")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "Change password for authenticated user"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        oldPassword: { type: "string" },
        newPassword: { type: "string" }
      }
    }
  })
  async changePassword(
    @Req() req: any,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string
  ): Promise<any> {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái thường, chữ hoa và số');
    }
    return this.authService.changePassword(req.user.id, oldPassword, newPassword);
  }

  @Post("verify-otp")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({
    summary: "verify OTP code"
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        otp: { type: "string", example: "123456" }
      }
    }
  })
  async verifyOtp(
    @Body("email") email: string,
    @Body("otp") otp: string
  ): Promise<any> {
    return this.authService.verifyOtp(email, otp);
  }
}
