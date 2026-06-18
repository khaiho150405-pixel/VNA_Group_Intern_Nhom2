import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BaseController } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { LoaiHinhKinhDoanh } from "./loai-hinh-kinh-doanh.entity";
import { LoaiHinhKinhDoanhService } from "./loai-hinh-kinh-doanh.service";

@ApiTags("Loai Hinh Kinh Doanh")
@Controller("loai-hinh-kinh-doanh")
@UseGuards(AuthGuard)
export class LoaiHinhKinhDoanhController extends BaseController<LoaiHinhKinhDoanh, LoaiHinhKinhDoanhService> {
  constructor(private readonly loaiHinhKinhDoanhService: LoaiHinhKinhDoanhService) {
    super(loaiHinhKinhDoanhService);
  }

  @Get("dropdown/active")
  async getActiveDropdown() {
    return await this.loaiHinhKinhDoanhService.getActiveForDropdown();
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
