import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { Repository } from "typeorm";
import { LoaiHinhKinhDoanh } from "./loai-hinh-kinh-doanh.entity";

@Injectable()
export class LoaiHinhKinhDoanhService extends BaseService<LoaiHinhKinhDoanh> {
  constructor(
    @InjectRepository(LoaiHinhKinhDoanh)
    private readonly loaiHinhKinhDoanhRepo: Repository<LoaiHinhKinhDoanh>,
  ) {
    super(loaiHinhKinhDoanhRepo, (data) => Object.assign(new LoaiHinhKinhDoanh(), data));
  }

  async getActiveForDropdown() {
    return await this.loaiHinhKinhDoanhRepo.find({ where: { trangthai: 'ACTIVE' } });
  }
}
