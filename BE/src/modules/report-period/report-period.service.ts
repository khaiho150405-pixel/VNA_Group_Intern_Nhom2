import { Injectable, BadRequestException, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReportPeriod } from "./report-period.entity";
import Response from "../../commons/response";

@Injectable()
export class ReportPeriodService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(ReportPeriod)
    private readonly reportPeriodRepo: Repository<ReportPeriod>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  // Seed default test configurations matching the UI screenshot
  private async seedDefaults() {
    const count = await this.reportPeriodRepo.count();
    if (count > 0) return;

    const defaults = [
      {
        year: 2022,
        reportName: "Báo cáo tai nạn lao động",
        period: "CA_NAM",
        startDate: new Date("2023-12-15T00:00:00Z"),
        endDate: new Date("2024-01-10T00:00:00Z"),
        status: "ACTIVE"
      }
    ];

    for (const item of defaults) {
      const entity = this.reportPeriodRepo.create(item);
      await this.reportPeriodRepo.save(entity);
    }
    console.log("== [Seed] report_periods: 1 bản ghi đã được khởi tạo ==");
  }

  async findAll(query: any) {
    const { year, reportName, period, startDate, endDate, status, page = 1, limit = 10 } = query || {};
    const qb = this.reportPeriodRepo.createQueryBuilder("rp");

    if (year) {
      qb.andWhere("rp.year = :year", { year: parseInt(year) });
    }
    if (reportName) {
      qb.andWhere("rp.report_name ILIKE :reportName", { reportName: `%${reportName}%` });
    }
    if (period) {
      qb.andWhere("rp.period = :period", { period });
    }
    if (status) {
      qb.andWhere("rp.status = :status", { status });
    }
    if (startDate) {
      qb.andWhere("rp.start_date >= :startDate", { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere("rp.end_date <= :endDate", { endDate: new Date(endDate) });
    }

    qb.orderBy("rp.id", "DESC");

    const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
    const take = parseInt(limit as any);
    qb.skip(skip).take(take);

    const [items, totalCount] = await qb.getManyAndCount();
    return { items, totalCount, page: parseInt(page as any), limit: parseInt(limit as any) };
  }

  async findById(id: number) {
    const item = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!item) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");
    return item;
  }

  async create(data: any) {
    if (!data.year || !data.reportName || !data.period || !data.startDate || !data.endDate) {
      throw new BadRequestException("Vui lòng điền đầy đủ các thông tin bắt buộc");
    }
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
    }
    const targetYear = parseInt(data.year);
    const existingPeriod = await this.reportPeriodRepo.findOne({
      where: {
        year: targetYear,
        period: data.period
      }
    });
    if (existingPeriod) {
      throw new BadRequestException(`Đã tồn tại cấu hình kỳ báo cáo ${data.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} cho năm ${targetYear}`);
    }

    const entity = this.reportPeriodRepo.create({
      year: targetYear,
      reportName: data.reportName,
      period: data.period,
      startDate: start,
      endDate: end,
      status: data.status || "ACTIVE",
    });
    const saved = await this.reportPeriodRepo.save(entity);
    return Response.get(saved);
  }

  async update(id: number, data: any) {
    const existing = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!existing) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");

    const startVal = data.startDate !== undefined ? new Date(data.startDate) : existing.startDate;
    const endVal = data.endDate !== undefined ? new Date(data.endDate) : existing.endDate;

    if (endVal < startVal) {
      throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
    }

    const nextYear = data.year !== undefined ? parseInt(data.year) : existing.year;
    const nextPeriod = data.period !== undefined ? data.period : existing.period;

    if (data.year !== undefined || data.period !== undefined) {
      const duplicate = await this.reportPeriodRepo.createQueryBuilder("rp")
        .where("rp.year = :year", { year: nextYear })
        .andWhere("rp.period = :period", { period: nextPeriod })
        .andWhere("rp.id != :id", { id })
        .getOne();
      if (duplicate) {
        throw new BadRequestException(`Đã tồn tại cấu hình kỳ báo cáo ${nextPeriod === 'CA_NAM' ? 'Cả năm' : '6 tháng'} cho năm ${nextYear}`);
      }
    }

    if (data.year !== undefined) existing.year = nextYear;
    if (data.reportName !== undefined) existing.reportName = data.reportName;
    if (data.period !== undefined) existing.period = nextPeriod;
    if (data.startDate !== undefined) existing.startDate = startVal;
    if (data.endDate !== undefined) existing.endDate = endVal;
    if (data.status !== undefined) existing.status = data.status;
    
    existing.updatedAt = new Date();
    const saved = await this.reportPeriodRepo.save(existing);
    return Response.get(saved);
  }

  async remove(id: number) {
    const existing = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!existing) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");
    await this.reportPeriodRepo.delete(id);
    return Response.SUCCESSFULLY;
  }
}
