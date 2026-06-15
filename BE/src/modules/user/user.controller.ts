import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get, Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  Logger,
  BadRequestException
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  BaseController,
  GetAllDto,
  ResponseInterceptor
} from "src/commons";
import Response from "src/commons/response";
import { AuthGuard } from "src/commons/guards/authGuard";
import { User } from "./user.entity";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
@UseGuards(AuthGuard)
export class UserController extends BaseController<User, UserService> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Post()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Create user" })
  async post(@Req() req: any, @Body() body: any): Promise<any> {
    const username = body.username;
    if (username) {
      const usernamePattern = /^[a-zA-Z0-9_.-]{3,50}$/;
      if (!usernamePattern.test(username)) {
        throw new BadRequestException('Tên đăng nhập không hợp lệ (3-50 ký tự, chỉ cho phép chữ cái không dấu, chữ số, dấu chấm, dấu gạch dưới, gạch ngang, không chứa dấu cách hoặc ký tự đặc biệt)');
      }
    }
    return await super.post(req, body);
  }

  @Get("checkUsername")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get items" })
  async checkUsername(
    @Query("username") username: string
  ): Promise<{ username: string; existed: boolean }> {
    return await this.userService.checkUsername(username);
  }

  @Get("checkEmail")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Check if email exists" })
  async checkEmail(
    @Query("email") email: string,
    @Query("excludeId") excludeId?: string
  ): Promise<{ email: string; existed: boolean }> {
    return await this.userService.checkEmail(email, excludeId);
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get items" })
  async getAll(@Query() query: GetAllDto): Promise<any> {
    return await this.userService.getAll(query);
  }

  @Post("import")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get items" })
  async import(
    @Req() req: any,
    @Body() body: any
  ): Promise<{ success: number; err: number; username: [] }> {
    return await this.userService.import(req.user, body);
  }

  @Post("recovery")
  @ApiOperation({ summary: "recovery account" })
  async recovery(
    @Body("user_id") user_id: string
  ): Promise<{ success: boolean }> {
    return await this.userService.recovery(user_id);
  }

  @Get(":id/reset-password")
  @ApiOperation({ summary: "reset password account" })
  async resetPassword(
    @Param("id") id: string
  ): Promise<{ success: boolean }> {
    return await this.userService.resetPassword(id);
  }

  @Post(":id/reset-password")
  @ApiOperation({ summary: "reset password account with custom password" })
  async resetPasswordCustom(
    @Param("id") id: string,
    @Body("password") password?: string
  ): Promise<{ success: boolean }> {
    return await this.userService.resetPasswordCustom(id, password);
  }

  @Put(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Cập nhật thông tin user" })
  async updateProfile(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: any
  ): Promise<any> {
    if ('fullName' in body) {
      if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim() === '') {
        const errorMsg = 'Họ và tên không được để trống';
        Logger.error(`Cập nhật thất bại: ${errorMsg}`, 'UserController');
        throw new BadRequestException(errorMsg);
      }
    }
    const updatedUser = await this.userService.updateUser(id, body, req.user);
    return Response.get(updatedUser);
  }

  @Delete('destroys')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Destroy items' })
  async destroys(
    @Req() req: any,
    @Body('ids') ids: string[]
  ): Promise<any> {
    return await this.userService.destroys(req.user, ids, req.doet);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return await this.userService.delete(req.user, id);
  }
}
