import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get, Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  BaseController,
  GetAllDto,
  ResponseInterceptor
} from "src/commons";
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

  @Get("checkUsername")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get items" })
  async checkUsername(
    @Query("username") username: string
  ): Promise<{ username: string; existed: boolean }> {
    return await this.userService.checkUsername(username);
  }

  @Get()
  @ApiOperation({ summary: "Get items" })
  async getAll(@Query() query: GetAllDto): Promise<any> {
    return await this.userService.getAll(query);
  }

  @Post("import")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Get items" })
  async import(
    @Req() req: any,
    @Body("users") users: any
  ): Promise<{ success: number; err: number; username: [] }> {
    return await this.userService.import(req.user, users);
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
}
