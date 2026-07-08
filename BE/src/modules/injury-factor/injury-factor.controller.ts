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
import { InjuryFactorService } from "./injury-factor.service";
import Response from "../../commons/response";

@ApiTags("Injury Factors - Yếu tố chấn thương")
@Controller("injury-factors")
@UseGuards(AuthGuard)
export class InjuryFactorController {
  constructor(private readonly injuryFactorService: InjuryFactorService) {}

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách yếu tố chấn thương (phân trang, tìm kiếm)" })
  async findAll(
    @Query("name") name?: string,
    @Query("code") code?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Request() req?: any,
  ) {
    return await this.injuryFactorService.findAll({
      name, code, status,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, req?.user);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách yếu tố chấn thương đang hoạt động (dropdown)" })
  async getActiveDropdown() {
    const data = await this.injuryFactorService.getActiveForDropdown();
    return Response.get(data);
  }

  @Get("check-code")
  @ApiOperation({ summary: "Kiểm tra mã code đã tồn tại" })
  async checkCode(
    @Query("code") code: string,
    @Query("id") id?: string,
  ) {
    return await this.injuryFactorService.checkCodeExists(code, id ? +id : undefined);
  }

  @Get(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy chi tiết yếu tố chấn thương" })
  async findById(@Param("id") id: string, @Request() req?: any) {
    const data = await this.injuryFactorService.findById(+id, req?.user);
    return Response.get(data);
  }

  @Post()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Tạo mới yếu tố chấn thương" })
  async create(@Body() body: any, @Request() req?: any) {
    return await this.injuryFactorService.create(body, req?.user);
  }

  @Put(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Cập nhật yếu tố chấn thương" })
  async update(@Param("id") id: string, @Body() body: any, @Request() req?: any) {
    return await this.injuryFactorService.update(+id, body, req?.user);
  }

  @Delete("destroys")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Xóa nhiều yếu tố chấn thương" })
  async removeMany(@Body("ids") ids: number[], @Request() req?: any) {
    return await this.injuryFactorService.removeMany(ids, req?.user);
  }

  @Delete(":id")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Xóa yếu tố chấn thương" })
  async remove(@Param("id") id: string, @Request() req?: any) {
    return await this.injuryFactorService.remove(+id, req?.user);
  }
}
