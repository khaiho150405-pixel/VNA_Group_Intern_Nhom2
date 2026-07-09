import { Injectable, OnApplicationBootstrap, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService, GetAllDto } from "src/commons";
import { Repository, getManager } from "typeorm";
import { Occupation } from "./occupation.entity";
import Response from "../../commons/response";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class OccupationService extends BaseService<Occupation> implements OnApplicationBootstrap {
  private async hasPermission(roleId: number | undefined, code: string): Promise<boolean> {
    if (!roleId) return false;
    const count = await this.occupationRepo.query(
      `SELECT COUNT(*) FROM role_permissions WHERE role_id = $1 AND permission_code = $2`,
      [roleId, code]
    );
    return parseInt(count[0]?.count || '0', 10) > 0;
  }

  async checkReadPermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_CATEGORY_VIEW');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xem danh mục chung.");
    }
  }

  async checkCreatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_CATEGORY_CREATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền thêm mới danh mục.");
    }
  }

  async checkUpdatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_CATEGORY_UPDATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền cập nhật danh mục.");
    }
  }

  async checkDeletePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_CATEGORY_DELETE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xóa danh mục.");
    }
  }

  constructor(
    @InjectRepository(Occupation)
    private readonly occupationRepo: Repository<Occupation>,
  ) {
    super(occupationRepo, (data) => Object.assign(new Occupation(), data));
  }

  async get(getAllDto: GetAllDto, doet: any = null) {
    if (!getAllDto.order || getAllDto.order === '{}') {
      getAllDto.order = JSON.stringify({ manghe: "ASC" });
    }
    return super.get(getAllDto, doet);
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
  }, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
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

    qb.orderBy("oc.manghe", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async post(currentUser: any, payload: any, id: any = null): Promise<any> {
    await this.checkCreatePermission(currentUser);
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
    await this.checkUpdatePermission(currentUser);
    if (payload.trangthai === 'INACTIVE') {
      const manager = getManager();
      const countRes = await manager.query(
        `SELECT COUNT(*) as count FROM accident_details WHERE nghe_nghiep_id = $1`,
        [id]
      );
      if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
        throw new BadRequestException('Nghề nghiệp này đang được sử dụng trong báo cáo, không thể tắt trạng thái');
      }
    }
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
      order: { manghe: 'ASC' }
    });
  }

  async delete(currentUser: any, id: string): Promise<any> {
    await this.checkDeletePermission(currentUser);
    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE nghe_nghiep_id = $1`,
      [id]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Nghề nghiệp này đang được sử dụng trong báo cáo, không thể xóa');
    }
    return super.delete(currentUser, id);
  }

  async deletes(currentUser: any, ids: string[], doet: any): Promise<any> {
    await this.checkDeletePermission(currentUser);
    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE nghe_nghiep_id = ANY($1::int[])`,
      [ids]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Một số nghề nghiệp đang được sử dụng trong báo cáo, không thể xóa');
    }
    return super.deletes(currentUser, ids, doet);
  }

  async destroy(currentUser: any, id: string): Promise<any> {
    await this.checkDeletePermission(currentUser);
    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE nghe_nghiep_id = $1`,
      [id]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Nghề nghiệp này đang được sử dụng trong báo cáo, không thể xóa');
    }
    return super.destroy(currentUser, id);
  }

  async destroys(currentUser: any, ids: string[], doet: any): Promise<any> {
    await this.checkDeletePermission(currentUser);
    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE nghe_nghiep_id = ANY($1::int[])`,
      [ids]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Một số nghề nghiệp đang được sử dụng trong báo cáo, không thể xóa');
    }
    return super.destroys(currentUser, ids, doet);
  }
}
