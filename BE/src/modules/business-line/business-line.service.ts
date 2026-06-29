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

  async checkNameExists(tennganh: string, excludeId?: number): Promise<boolean> {
    if (!tennganh) return false;
    const qb = this.businessLineRepo.createQueryBuilder("bl")
      .where("bl.tennganh = :tennganh", { tennganh: tennganh.trim() });
    if (excludeId) qb.andWhere("bl.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return !!found;
  }

  getParentCode(manganh: string): string | null {
    const code = manganh.trim();
    if (code.length <= 1) return null;
    if (code.length === 2) {
      const num = parseInt(code, 10);
      if (isNaN(num)) return null;
      if (num >= 1 && num <= 3) return 'A';
      if (num >= 5 && num <= 9) return 'B';
      if (num >= 10 && num <= 33) return 'C';
      if (num === 35) return 'D';
      if (num >= 36 && num <= 39) return 'E';
      if (num >= 41 && num <= 43) return 'F';
      if (num >= 45 && num <= 47) return 'G';
      if (num >= 49 && num <= 53) return 'H';
      if (num >= 55 && num <= 56) return 'I';
      if (num >= 58 && num <= 63) return 'J';
      if (num >= 64 && num <= 66) return 'K';
      if (num === 68) return 'L';
      if (num >= 69 && num <= 75) return 'M';
      if (num >= 77 && num <= 82) return 'N';
      if (num === 84) return 'O';
      if (num === 85) return 'P';
      if (num >= 86 && num <= 88) return 'Q';
      if (num >= 90 && num <= 93) return 'R';
      if (num >= 94 && num <= 96) return 'S';
      if (num >= 97 && num <= 98) return 'T';
      if (num === 99) return 'U';
      return null;
    }
    return code.slice(0, -1);
  }

  async post(currentUser: any, payload: any, id: any = null): Promise<any> {
    if (payload.manganh) {
      const trimmedCode = payload.manganh.trim();
      if (trimmedCode.length < 1 || trimmedCode.length > 4) {
        throw Response.errorBad(`Mã ngành chỉ được nhập từ 1-4 ký tự`);
      }
      const exists = await this.checkCodeExists(payload.manganh);
      if (exists) throw Response.errorBad(`Mã ngành "${payload.manganh}" đã tồn tại`);

      // Validate parent-child relationship
      if (trimmedCode.length > 1) {
        const parentCode = this.getParentCode(trimmedCode);
        if (!parentCode) {
          throw Response.errorBad(`Mã ngành không hợp lệ theo bảng phân loại ngành kinh tế Việt Nam`);
        }
        const parentExists = await this.checkCodeExists(parentCode);
        if (!parentExists) {
          throw Response.errorBad(`Ngành con chưa có ngành cha: Không tìm thấy nhóm ngành cha "${parentCode}" trong hệ thống`);
        }
      }
    }
    if (payload.tennganh) {
      const existsName = await this.checkNameExists(payload.tennganh);
      if (existsName) throw Response.errorBad(`Tên ngành "${payload.tennganh}" đã tồn tại`);
    }
    return super.post(currentUser, payload, id);
  }

  async put(currentUser: any, id: any, payload: any): Promise<any> {
    if (payload.manganh) {
      const trimmedCode = payload.manganh.trim();
      if (trimmedCode.length < 1 || trimmedCode.length > 4) {
        throw Response.errorBad(`Mã ngành chỉ được nhập từ 1-4 ký tự`);
      }
      const exists = await this.checkCodeExists(payload.manganh, +id);
      if (exists) throw Response.errorBad(`Mã ngành "${payload.manganh}" đã tồn tại`);

      // Validate parent-child relationship
      if (trimmedCode.length > 1) {
        const parentCode = this.getParentCode(trimmedCode);
        if (!parentCode) {
          throw Response.errorBad(`Mã ngành không hợp lệ theo bảng phân loại ngành kinh tế Việt Nam`);
        }
        const parentExists = await this.checkCodeExists(parentCode);
        if (!parentExists) {
          throw Response.errorBad(`Ngành con chưa có ngành cha: Không tìm thấy nhóm ngành cha "${parentCode}" trong hệ thống`);
        }
      }
    }
    if (payload.tennganh) {
      const existsName = await this.checkNameExists(payload.tennganh, +id);
      if (existsName) throw Response.errorBad(`Tên ngành "${payload.tennganh}" đã tồn tại`);
    }
    return super.put(currentUser, id, payload);
  }
}