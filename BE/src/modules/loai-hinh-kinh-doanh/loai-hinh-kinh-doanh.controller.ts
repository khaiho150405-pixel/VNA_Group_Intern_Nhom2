import { Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor } from "src/commons";
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
