import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { Repository } from "typeorm";
import { Occupation } from "./occupation.entity";
import Response from "../../commons/response";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class OccupationService extends BaseService<Occupation> implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Occupation)
    private readonly occupationRepo: Repository<Occupation>,
  ) {
    super(occupationRepo, (data) => Object.assign(new Occupation(), data));
  }

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    try {
      const sqlPath = path.resolve(process.cwd(), 'src/sql/occupation.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await this.occupationRepo.query(sql);
        console.log("== [Seed] occupation: Đã chạy file SQL ==");
      }
    } catch (error) {
      console.error("== [Seed] Lỗi khi chạy occupation.sql ===", error);
    }
  }

  async checkCodeExists(manghe: string, excludeId?: number): Promise<boolean> {
    if (!manghe) return false;
    const qb = this.occupationRepo.createQueryBuilder("oc")
      .where("oc.manghe = :manghe", { manghe: manghe.trim() });
    if (excludeId) qb.andWhere("oc.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return !!found;
  }

  async checkNameExists(tennghe: string, excludeId?: number): Promise<boolean> {
    if (!tennghe) return false;
    const qb = this.occupationRepo.createQueryBuilder("oc")
      .where("oc.tennghe = :tennghe", { tennghe: tennghe.trim() });
    if (excludeId) qb.andWhere("oc.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return !!found;
  }

  async findAll(query: {
    manghe?: string;
    tennghe?: string;
    cap?: string;
    trangthai?: string;
    page?: number;
    limit?: number;
  }) {
    const { manghe, tennghe, cap, trangthai, page = 1, limit = 10 } = query;

    const qb = this.occupationRepo.createQueryBuilder("oc");

    if (manghe) {
      qb.andWhere("oc.manghe ILIKE :manghe", { manghe: `%${manghe}%` });
    }
    if (tennghe) {
      qb.andWhere("oc.tennghe ILIKE :tennghe", { tennghe: `%${tennghe}%` });
    }
    if (cap) {
      qb.andWhere("oc.cap = :cap", { cap: +cap });
    }
    if (trangthai) {
      qb.andWhere("oc.trangthai = :trangthai", { trangthai });
    }

    qb.orderBy("oc.id", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async post(currentUser: any, payload: any, id: any = null): Promise<any> {
    if (payload.manghe) {
      const trimmedCode = payload.manghe.trim();
      const exists = await this.checkCodeExists(payload.manghe);
      if (exists) throw Response.errorBad(`Mã nghề nghiệp "${payload.manghe}" đã tồn tại`);
    }
    if (payload.tennghe) {
      const existsName = await this.checkNameExists(payload.tennghe);
      if (existsName) throw Response.errorBad(`Tên nghề nghiệp "${payload.tennghe}" đã tồn tại`);
    }
    return super.post(currentUser, payload, id);
  }

  async put(currentUser: any, id: any, payload: any): Promise<any> {
    if (payload.manghe) {
      const exists = await this.checkCodeExists(payload.manghe, +id);
      if (exists) throw Response.errorBad(`Mã nghề nghiệp "${payload.manghe}" đã tồn tại`);
    }
    if (payload.tennghe) {
      const existsName = await this.checkNameExists(payload.tennghe, +id);
      if (existsName) throw Response.errorBad(`Tên nghề nghiệp "${payload.tennghe}" đã tồn tại`);
    }
    return super.put(currentUser, id, payload);
  }

  async getActiveForDropdown() {
    return await this.occupationRepo.find({
      where: { trangthai: 'ACTIVE' },
      order: { id: 'ASC' }
    });
  }
}
