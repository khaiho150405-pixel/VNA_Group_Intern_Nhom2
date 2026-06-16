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

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {
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

  @Get("verify-session")
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Verify active login session"
  })
  async verifySession(): Promise<any> {
    return { success: true };
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
    if (passwordNew.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 kí tự');
    }
    const hasLetter = /[a-zA-Z]/.test(passwordNew);
    const hasNumber = /[0-9]/.test(passwordNew);
    if (!hasLetter || !hasNumber) {
      throw new BadRequestException('Mật khẩu mới quá yếu. Cần chứa ít nhất chữ và số.');
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
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 kí tự');
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      throw new BadRequestException('Mật khẩu mới quá yếu. Cần chứa ít nhất chữ và số.');
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
