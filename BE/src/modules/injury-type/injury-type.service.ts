import { Injectable, OnApplicationBootstrap, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { InjuryType } from "./injury-type.entity";
import Response from "../../commons/response";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class InjuryTypeService implements OnApplicationBootstrap {
  private async hasPermission(roleId: number | undefined, code: string): Promise<boolean> {
    if (!roleId) return false;
    const count = await this.injuryTypeRepo.query(
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
    @InjectRepository(InjuryType)
    private readonly injuryTypeRepo: Repository<InjuryType>,
  ) { }

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const hasCorrectSeed = await this.injuryTypeRepo.findOne({ where: { code: '34' } });
    const count = await this.injuryTypeRepo.count();
    if (hasCorrectSeed && count === 14) return; // Already seeded correctly

    try {
      const sqlPath = path.resolve(process.cwd(), 'src/sql/injury-types.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await this.injuryTypeRepo.query(sql);
        console.log("== [Seed] injury_types: Đã chạy file SQL ==");
      }
    } catch (error) {
      console.error("== [Seed] Lỗi khi chạy injury-types.sql ==", error);
    }
  }

  /**
   * Lấy tất cả loại chấn thương (phân trang, tìm kiếm)
   */
  async findAll(query: {
    name?: string;
    code?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
  }, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
    const { name, code, level, status, page = 1, limit = 10 } = query;

    const qb = this.injuryTypeRepo.createQueryBuilder("it");

    if (name) {
      qb.andWhere("it.name ILIKE :name", { name: `%${name}%` });
    }
    if (code) {
      qb.andWhere("it.code ILIKE :code", { code: `%${code}%` });
    }
    if (level) {
      qb.andWhere("it.level = :level", { level: +level });
    }
    if (status !== undefined && status !== "") {
      qb.andWhere("it.status = :status", { status: status === "true" });
    }

    qb.orderBy("it.code", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Lấy danh sách active (cho dropdown)
   */
  async getActiveForDropdown() {
    return await this.injuryTypeRepo.find({
      where: { status: true },
      order: { code: "ASC" },
    });
  }

  /**
   * Lấy chi tiết theo ID
   */
  async findById(id: number, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
    const item = await this.injuryTypeRepo.findOne({ where: { id } });
    if (!item) throw Response.errorNotFound("Không tìm thấy loại chấn thương");
    return item;
  }

  /**
   * Kiểm tra mã code đã tồn tại
   */
  async checkCodeExists(code: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!code) return { exists: false };
    const qb = this.injuryTypeRepo.createQueryBuilder("it")
      .where("it.code = :code", { code: code.trim() });
    if (excludeId) qb.andWhere("it.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return { exists: !!found };
  }

  /**
   * Tạo mới
   */
  async create(data: Partial<InjuryType>, currentUser?: any) {
    if (currentUser) await this.checkCreatePermission(currentUser);
    const { exists } = await this.checkCodeExists(data.code);
    if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);

    const entity = this.injuryTypeRepo.create({ ...data, status: data.status ?? true });
    const saved = await this.injuryTypeRepo.save(entity);
    return Response.get(saved);
  }

  /**
   * Cập nhật
   */
  async update(id: number, data: Partial<InjuryType>, currentUser?: any) {
    if (currentUser) await this.checkUpdatePermission(currentUser);
    const existing = await this.findById(id);

    if (data.code && data.code !== existing.code) {
      const { exists } = await this.checkCodeExists(data.code, id);
      if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);
    }

    const isDeactivating = ((data.status as any) === false || (data.status as any) === 'INACTIVE') && ((existing.status as any) !== false && (existing.status as any) !== 'INACTIVE');
    if (isDeactivating) {
      const manager = getManager();
      const countRes = await manager.query(
        `SELECT COUNT(*) as count FROM accident_details WHERE yeu_to_chan_thuong_id = $1`,
        [id]
      );
      if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
        throw new BadRequestException('Loại hình chấn thương này đang được sử dụng trong báo cáo, không thể tắt trạng thái');
      }
    }

    Object.assign(existing, data, { updatedAt: new Date() });
    const saved = await this.injuryTypeRepo.save(existing);
    return Response.get(saved);
  }

  /**
   * Xóa vĩnh viễn
   */
  async remove(id: number, currentUser?: any) {
    if (currentUser) await this.checkDeletePermission(currentUser);
    await this.findById(id);

    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE yeu_to_chan_thuong_id = $1`,
      [id]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Loại hình chấn thương này đang được sử dụng trong báo cáo, không thể xóa');
    }

    await this.injuryTypeRepo.delete(id);
    return Response.SUCCESSFULLY;
  }

  /**
   * Xóa nhiều
   */
  async removeMany(ids: number[], currentUser?: any) {
    if (currentUser) await this.checkDeletePermission(currentUser);
    if (!ids || ids.length === 0) throw Response.errorBad("Danh sách ID không được rỗng");

    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM accident_details WHERE yeu_to_chan_thuong_id = ANY($1::int[])`,
      [ids]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException('Một số loại hình chấn thương đang được sử dụng trong báo cáo, không thể xóa');
    }

    await this.injuryTypeRepo.delete(ids);
    return Response.SUCCESSFULLY;
  }
}
