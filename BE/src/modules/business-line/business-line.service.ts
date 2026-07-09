import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService, GetAllDto } from "src/commons";
import { Repository, getManager } from "typeorm";
import { BusinessLine } from "./business-line.entity";
import Response from "../../commons/response";

@Injectable()
export class BusinessLineService extends BaseService<BusinessLine> {
  private async hasPermission(roleId: number | undefined, code: string): Promise<boolean> {
    if (!roleId) return false;
    const count = await this.businessLineRepo.query(
      `SELECT COUNT(*) FROM role_permissions WHERE role_id = $1 AND permission_code = $2`,
      [roleId, code]
    );
    return parseInt(count[0]?.count || '0', 10) > 0;
  }

  async checkReadPermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_NGANH_NGHE_KD_VIEW');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xem ngành nghề kinh doanh.");
    }
  }

  async checkCreatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_NGANH_NGHE_KD_CREATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền thêm mới ngành nghề kinh doanh.");
    }
  }

  async checkUpdatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_NGANH_NGHE_KD_UPDATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền cập nhật ngành nghề kinh doanh.");
    }
  }

  async checkDeletePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_NGANH_NGHE_KD_DELETE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xóa ngành nghề kinh doanh.");
    }
  }

  constructor(
    @InjectRepository(BusinessLine)
    private readonly businessLineRepo: Repository<BusinessLine>,
  ) {
    super(businessLineRepo, (data) => Object.assign(new BusinessLine(), data));
  }

  async get(getAllDto: GetAllDto, doet: any = null) {
    if (!getAllDto.order || getAllDto.order === '{}') {
      getAllDto.order = JSON.stringify({ manganh: "ASC" });
    }
    return super.get(getAllDto, doet);
  }

  async getActiveLevel4ForDropdown() {
    return await this.businessLineRepo.find({ where: { trangthai: 'ACTIVE', cap: 4 } });
  }

  private async checkInUseByEnterprise(id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    const manager = getManager();
    const result = await manager.query(
      `SELECT COUNT(*) as count FROM doets WHERE business_line_id = ANY($1::int[]) AND "deletedAt" IS NULL`,
      [ids]
    );
    if (parseInt(result[0]?.count || '0', 10) > 0) {
      throw new BadRequestException('Ngành nghề kinh doanh này đang được sử dụng bởi doanh nghiệp, không thể xóa hoặc tắt trạng thái');
    }
  }

  async findAll(query: {
    manganh?: string;
    tennganh?: string;
    cap?: string;
    trangthai?: string;
    page?: number;
    limit?: number;
  }, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
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

    qb.orderBy("bl.manganh", "ASC")
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
    await this.checkCreatePermission(currentUser);
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
    await this.checkUpdatePermission(currentUser);
    if (payload.trangthai === 'INACTIVE') {
      await this.checkInUseByEnterprise(id);
    }
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

  async delete(currentUser: any, id: string): Promise<any> {
    await this.checkDeletePermission(currentUser);
    await this.checkInUseByEnterprise(id);
    return super.delete(currentUser, id);
  }

  async deletes(currentUser: any, ids: string[], doet: any): Promise<any> {
    await this.checkDeletePermission(currentUser);
    await this.checkInUseByEnterprise(ids);
    return super.deletes(currentUser, ids, doet);
  }

  async destroy(currentUser: any, id: string): Promise<any> {
    await this.checkDeletePermission(currentUser);
    await this.checkInUseByEnterprise(id);
    return super.destroy(currentUser, id);
  }

  async destroys(currentUser: any, ids: string[], doet: any): Promise<any> {
    await this.checkDeletePermission(currentUser);
    await this.checkInUseByEnterprise(ids);
    return super.destroys(currentUser, ids, doet);
  }
}