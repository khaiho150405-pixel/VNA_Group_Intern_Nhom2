import { Body, ClassSerializerInterceptor, Controller, Get, Param, Post, Request, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BaseController, ResponseData, ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { Doet } from "./doet.entity";
import { DoetService } from "./doet.service";
import { KeyValue } from "../../commons/bases/baseAddressEntity";

@ApiTags("Doets")
@Controller("doets")
@UseGuards(AuthGuard)
export class DoetController extends BaseController<Doet, DoetService> {
  constructor(private readonly doetService: DoetService) {
    super(doetService);
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
}
