import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjuryType } from "./injury-type.entity";
import Response from "../../commons/response";

@Injectable()
export class InjuryTypeService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(InjuryType)
    private readonly injuryTypeRepo: Repository<InjuryType>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const count = await this.injuryTypeRepo.count();
    if (count > 0) return; // Đã có dữ liệu, bỏ qua

    const seedData = [
      { code: "LCT_01", name: "Chấn thương sọ não" },
      { code: "LCT_02", name: "Gãy xương (tay, chân, sườn...)" },
      { code: "LCT_03", name: "Cắt cụt / Mất bộ phận cơ thể" },
      { code: "LCT_04", name: "Chấn thương cột sống" },
      { code: "LCT_05", name: "Bỏng nhiệt / Bỏng hóa chất" },
      { code: "LCT_06", name: "Tổn thương mắt / Mất thị lực" },
      { code: "LCT_07", name: "Ngạt thở / Ngộ độc khí" },
      { code: "LCT_08", name: "Tổn thương phần mềm (Rách da, bầm dập)" },
      { code: "LCT_09", name: "Chấn thương cơ quan nội tạng" },
      { code: "LCT_10", name: "Điện giật" },
      { code: "LCT_99", name: "Loại chấn thương khác" },
    ];

    for (const item of seedData) {
      const entity = this.injuryTypeRepo.create({ ...item, status: true });
      await this.injuryTypeRepo.save(entity);
    }

    console.log("== [Seed] injury_types: 11 bản ghi đã được khởi tạo ==");
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
  }) {
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

    qb.orderBy("it.id", "ASC")
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
      order: { id: "ASC" },
    });
  }

  /**
   * Lấy chi tiết theo ID
   */
  async findById(id: number) {
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
  async create(data: Partial<InjuryType>) {
    const { exists } = await this.checkCodeExists(data.code);
    if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);

    const entity = this.injuryTypeRepo.create({ ...data, status: data.status ?? true });
    const saved = await this.injuryTypeRepo.save(entity);
    return Response.get(saved);
  }

  /**
   * Cập nhật
   */
  async update(id: number, data: Partial<InjuryType>) {
    const existing = await this.findById(id);

    if (data.code && data.code !== existing.code) {
      const { exists } = await this.checkCodeExists(data.code, id);
      if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);
    }

    Object.assign(existing, data, { updatedAt: new Date() });
    const saved = await this.injuryTypeRepo.save(existing);
    return Response.get(saved);
  }

  /**
   * Xóa vĩnh viễn
   */
  async remove(id: number) {
    await this.findById(id); // Kiểm tra tồn tại
    await this.injuryTypeRepo.delete(id);
    return Response.SUCCESSFULLY;
  }

  /**
   * Xóa nhiều
   */
  async removeMany(ids: number[]) {
    if (!ids || ids.length === 0) throw Response.errorBad("Danh sách ID không được rỗng");
    await this.injuryTypeRepo.delete(ids);
    return Response.SUCCESSFULLY;
  }
}
