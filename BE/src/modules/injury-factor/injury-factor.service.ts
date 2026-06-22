import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InjuryFactor } from "./injury-factor.entity";
import Response from "../../commons/response";

@Injectable()
export class InjuryFactorService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(InjuryFactor)
    private readonly injuryFactorRepo: Repository<InjuryFactor>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    const count = await this.injuryFactorRepo.count();
    if (count > 0) return; // Đã có dữ liệu, bỏ qua

    const seedData = [
      { code: "Mã 1", name: "Điện" },
      { code: "Mã 2", name: "Phóng xạ" },
      { code: "Mã 3", name: "Thiết bị áp lực" },
      { code: "Mã 4", name: "Thiết bị nâng" },
      { code: "Mã 5", name: "Bộ phận truyền động, chuyển động của máy, thiết bị gây cán, cuốn, đè, ép, kẹp, cắt, va đập,..." },
      { code: "Mã 6", name: "Vật văng bắn" },
      { code: "Mã 7", name: "Vật rơi, đổ, sập" },
      { code: "Mã 8", name: "Sập đổ công trình, giàn giáo" },
      { code: "Mã 9", name: "Sập lò, sập đất đá" },
    ];

    for (const item of seedData) {
      const entity = this.injuryFactorRepo.create({ ...item, status: true });
      await this.injuryFactorRepo.save(entity);
    }

    console.log("== [Seed] injury_factors: 9 bản ghi đã được khởi tạo ==");
  }

  /**
   * Lấy tất cả yếu tố chấn thương (phân trang, tìm kiếm)
   */
  async findAll(query: {
    name?: string;
    code?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { name, code, status, page = 1, limit = 10 } = query;

    const qb = this.injuryFactorRepo.createQueryBuilder("inf");

    if (name) {
      qb.andWhere("inf.name ILIKE :name", { name: `%${name}%` });
    }
    if (code) {
      qb.andWhere("inf.code ILIKE :code", { code: `%${code}%` });
    }
    if (status !== undefined && status !== "") {
      qb.andWhere("inf.status = :status", { status: status === "true" });
    }

    qb.orderBy("inf.id", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * Lấy danh sách active (cho dropdown)
   */
  async getActiveForDropdown() {
    return await this.injuryFactorRepo.find({
      where: { status: true },
      order: { id: "ASC" },
    });
  }

  /**
   * Lấy chi tiết theo ID
   */
  async findById(id: number) {
    const item = await this.injuryFactorRepo.findOne({ where: { id } });
    if (!item) throw Response.errorNotFound("Không tìm thấy yếu tố chấn thương");
    return item;
  }

  /**
   * Kiểm tra mã code đã tồn tại
   */
  async checkCodeExists(code: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!code) return { exists: false };
    const qb = this.injuryFactorRepo.createQueryBuilder("inf")
      .where("inf.code = :code", { code: code.trim() });
    if (excludeId) qb.andWhere("inf.id <> :id", { id: excludeId });
    const found = await qb.getOne();
    return { exists: !!found };
  }

  /**
   * Tạo mới
   */
  async create(data: Partial<InjuryFactor>) {
    const { exists } = await this.checkCodeExists(data.code);
    if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);

    const entity = this.injuryFactorRepo.create({ ...data, status: data.status ?? true });
    const saved = await this.injuryFactorRepo.save(entity);
    return Response.get(saved);
  }

  /**
   * Cập nhật
   */
  async update(id: number, data: Partial<InjuryFactor>) {
    const existing = await this.findById(id);

    if (data.code && data.code !== existing.code) {
      const { exists } = await this.checkCodeExists(data.code, id);
      if (exists) throw Response.errorBad(`Mã "${data.code}" đã tồn tại`);
    }

    Object.assign(existing, data, { updatedAt: new Date() });
    const saved = await this.injuryFactorRepo.save(existing);
    return Response.get(saved);
  }

  /**
   * Xóa vĩnh viễn
   */
  async remove(id: number) {
    await this.findById(id);
    await this.injuryFactorRepo.delete(id);
    return Response.SUCCESSFULLY;
  }

  /**
   * Xóa nhiều
   */
  async removeMany(ids: number[]) {
    if (!ids || ids.length === 0) throw Response.errorBad("Danh sách ID không được rỗng");
    await this.injuryFactorRepo.delete(ids);
    return Response.SUCCESSFULLY;
  }
}
