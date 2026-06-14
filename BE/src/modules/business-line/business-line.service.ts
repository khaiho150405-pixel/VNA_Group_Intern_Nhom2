import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { Repository } from "typeorm";
import { BusinessLine } from "./business-line.entity";

@Injectable()
export class BusinessLineService extends BaseService<BusinessLine> {
  constructor(
    @InjectRepository(BusinessLine)
    private readonly businessLineRepo: Repository<BusinessLine>,
  ) {
    super(businessLineRepo, (data) => Object.assign(new BusinessLine(), data));
  }

  async getActiveLevel4ForDropdown() {
    return await this.businessLineRepo.find({ where: { trangthai: 'ACTIVE', cap: 4 } });
  }
}