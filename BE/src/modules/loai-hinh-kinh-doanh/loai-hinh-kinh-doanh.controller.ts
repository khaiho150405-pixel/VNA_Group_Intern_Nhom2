import { Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor, Request, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor, GetAllDto } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { LoaiHinhKinhDoanh } from "./loai-hinh-kinh-doanh.entity";
import { LoaiHinhKinhDoanhService } from "./loai-hinh-kinh-doanh.service";
import Response from "../../commons/response";

@ApiTags("Loai Hinh Kinh Doanh")
@Controller("loai-hinh-kinh-doanh")
@UseGuards(AuthGuard)
export class LoaiHinhKinhDoanhController extends BaseController<LoaiHinhKinhDoanh, LoaiHinhKinhDoanhService> {
  constructor(private readonly loaiHinhKinhDoanhService: LoaiHinhKinhDoanhService) {
    super(loaiHinhKinhDoanhService);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách loại hình kinh doanh đang hoạt động" })
  async getActiveDropdown() {
    const data = await this.loaiHinhKinhDoanhService.getActiveForDropdown();
    return Response.get(data);
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy danh sách loại hình kinh doanh' })
  async get(@Query() getAllDto: GetAllDto, @Request() req) {
    await this.loaiHinhKinhDoanhService.checkReadPermission(req.user);
    return await super.get(getAllDto, req);
  }

  @Get(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy chi tiết loại hình kinh doanh' })
  async getDetail(
    @Query() getAllDto: GetAllDto,
    @Param('id') id: string,
    @Request() req
  ) {
    await this.loaiHinhKinhDoanhService.checkReadPermission(req.user);
    return await super.getDetail(getAllDto, id, req);
  }
}

@ApiTags("Public Loai Hinh Kinh Doanh")
@Controller("public/loai-hinh-kinh-doanh")
export class PublicLoaiHinhKinhDoanhController {
  constructor(private readonly loaiHinhKinhDoanhService: LoaiHinhKinhDoanhService) {}

  @Get("dropdown/active")
  async getActiveDropdown() {
    return await this.loaiHinhKinhDoanhService.getActiveForDropdown();
  }
}
