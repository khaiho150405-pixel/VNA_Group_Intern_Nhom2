import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { InjuryTypeService } from "./injury-type.service";
import Response from "../../commons/response";

@ApiTags("Injury Types - Loại chấn thương")
@Controller("injury-types")
@UseGuards(AuthGuard)
export class InjuryTypeController {
  constructor(private readonly injuryTypeService: InjuryTypeService) {}

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách loại chấn thương (phân trang, tìm kiếm)" })
  async findAll(
    @Query("name") name?: string,
    @Query("code") code?: string,
    @Query("level") level?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Request() req?: any,
  ) {
    return await this.injuryTypeService.findAll({
      name, code, level, status,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, req?.user);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách loại chấn thương đang hoạt động (dropdown)" })
  async getActiveDropdown() {
    const data = await this.injuryTypeService.getActiveForDropdown();
    return Response.get(data);
  }

  @Get("check-code")
  @ApiOperation({ summary: "Kiểm tra mã code đã tồn tại" })
  async checkCode(
    @Query("code") code: string,
    @Query("id") id?: string,
  ) {
    return await this.injuryTypeService.checkCodeExists(code, id ? +id : undefined);
  }

  @Get(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy chi tiết loại chấn thương" })
  async findById(@Param("id") id: string, @Request() req?: any) {
    const data = await this.injuryTypeService.findById(+id, req?.user);
    return Response.get(data);
  }

  @Post()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Tạo mới loại chấn thương" })
  async create(@Body() body: any, @Request() req?: any) {
    return await this.injuryTypeService.create(body, req?.user);
  }

  @Put(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Cập nhật loại chấn thương" })
  async update(@Param("id") id: string, @Body() body: any, @Request() req?: any) {
    return await this.injuryTypeService.update(+id, body, req?.user);
  }

  @Delete("destroys")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Xóa nhiều loại chấn thương" })
  async removeMany(@Body("ids") ids: number[], @Request() req?: any) {
    return await this.injuryTypeService.removeMany(ids, req?.user);
  }

  @Delete(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Xóa loại chấn thương" })
  async remove(@Param("id") id: string, @Request() req?: any) {
    return await this.injuryTypeService.remove(+id, req?.user);
  }
}
