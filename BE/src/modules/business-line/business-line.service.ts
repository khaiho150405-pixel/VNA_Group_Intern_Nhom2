import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { Repository } from "typeorm";
import { BusinessLine } from "./business-line.entity";
import Response from "../../commons/response";

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

  async findAll(query: {
    manganh?: string;
    tennganh?: string;
    cap?: string;
    trangthai?: string;
    page?: number;
    limit?: number;
  }) {
    const { manganh, tennganh, cap, trangthai, page = 1, limit = 10 } = query;

    const qb = this.businessLineRepo.createQueryBuilder("bl");

    if (manganh) {
      qb.andWhere("bl.manganh ILIKE :manganh", { manganh: `%${manganh}%` });
    }
    if (tennganh) {
      qb.andWhere("bl.tennganh ILIKE :tennganh", { tennganh: `%${tennganh}%` });
    }
    if (cap) {
      qb.andWhere("bl.cap = :cap", { cap: +cap });
    }
    if (trangthai) {
      qb.andWhere("bl.trangthai = :trangthai", { trangthai });
    }

    qb.orderBy("bl.id", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async checkCodeExists(manganh: string, excludeId?: number): Promise<boolean> {
    if (!manganh) return false;
    const qb = this.businessLineRepo.createQueryBuilder("bl")
      .where("bl.manganh = :manganh", { manganh: manganh.trim() });
    if (excludeId) qb.andWhere("bl.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return !!found;
  }

  async post(currentUser: any, payload: any, id: any = null): Promise<any> {
    if (payload.manganh) {
      const exists = await this.checkCodeExists(payload.manganh);
      if (exists) throw Response.errorBad(`Mã ngành "${payload.manganh}" đã tồn tại`);
    }
    return super.post(currentUser, payload, id);
  }

  async put(currentUser: any, id: any, payload: any): Promise<any> {
    if (payload.manganh) {
      const exists = await this.checkCodeExists(payload.manganh, +id);
      if (exists) throw Response.errorBad(`Mã ngành "${payload.manganh}" đã tồn tại`);
    }
    return super.put(currentUser, id, payload);
  }
}