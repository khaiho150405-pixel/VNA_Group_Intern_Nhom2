import {
  ClassSerializerInterceptor,
  Controller,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  Body, Req, Get, Query
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
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
  async login(@Request() req): Promise<ResponseData<LoginModel>> {
    return this.authService.login(req.user, req.doet);
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
    return this.authService.resetPassword(email, otp, passwordNew);
  }

  @Post("change-password")
  @UseGuards(AuthGuard)
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
