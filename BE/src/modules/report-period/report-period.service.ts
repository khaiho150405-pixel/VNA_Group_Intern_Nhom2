import { Injectable, BadRequestException, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { ReportPeriod } from "./report-period.entity";
import { PeriodicReport } from "../periodic-report/periodic-report.entity";
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

    const getYearFromDate = (date: Date | string): number => {
      if (typeof date === 'string') {
        const match = date.match(/^(\d{4})/);
        if (match) return parseInt(match[1], 10);
        return new Date(date).getFullYear();
      }
      return date instanceof Date ? date.getFullYear() : NaN;
    };

    const startYear = getYearFromDate(data.startDate);
    const endYear = getYearFromDate(data.endDate);

    if (startYear !== targetYear) {
      throw new BadRequestException(`Ngày bắt đầu phải nằm trong năm ${targetYear}`);
    }
    if (endYear !== targetYear) {
      throw new BadRequestException(`Ngày kết thúc phải nằm trong năm ${targetYear}`);
    }

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

    const startVal = data.startDate !== undefined ? data.startDate : existing.startDate;
    const endVal = data.endDate !== undefined ? data.endDate : existing.endDate;

    const startParsed = new Date(startVal);
    const endParsed = new Date(endVal);
    if (endParsed < startParsed) {
      throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
    }

    const nextYear = data.year !== undefined ? parseInt(data.year) : existing.year;
    
    if (data.startDate !== undefined || data.endDate !== undefined || data.year !== undefined) {
      const getYearFromDate = (date: Date | string): number => {
        if (typeof date === 'string') {
          const match = date.match(/^(\d{4})/);
          if (match) return parseInt(match[1], 10);
          return new Date(date).getFullYear();
        }
        return date instanceof Date ? date.getFullYear() : NaN;
      };

      const startYear = getYearFromDate(startVal);
      const endYear = getYearFromDate(endVal);

      if (startYear !== nextYear) {
        throw new BadRequestException(`Ngày bắt đầu phải nằm trong năm ${nextYear}`);
      }
      if (endYear !== nextYear) {
        throw new BadRequestException(`Ngày kết thúc phải nằm trong năm ${nextYear}`);
      }
    }

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
    if (data.startDate !== undefined) existing.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) existing.endDate = new Date(data.endDate);
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

  /**
   * Lấy danh sách kỳ báo cáo dành cho doanh nghiệp (enterprise).
   * Ràng buộc:
   * - Chỉ hiển thị các kỳ báo cáo có startDate >= ngày đăng ký tài khoản của doanh nghiệp
   *   (tức là kỳ tại thời điểm đăng ký hoặc trong tương lai).
   * - Kỳ báo cáo có startDate trước ngày đăng ký sẽ bị loại khỏi danh sách.
   * - Các kỳ báo cáo có startDate >= ngày đăng ký, endDate đã qua (quá hạn)
   *   mà doanh nghiệp chưa khai báo sẽ có displayStatus = 'HET_HAN'.
   */
  async findForEnterprise(currentUser: any, query: any = {}) {
    const doetId = currentUser?.doet || currentUser?.doet_id;

    // Lấy ngày đăng ký tài khoản doanh nghiệp (createdAt của doanh nghiệp)
    let registrationDate: Date | null = null;
    if (doetId) {
      try {
        const manager = getManager();
        // Lấy createdAt từ bảng doets trước
        const doets = await manager.query(
          `SELECT "createdAt" FROM doets WHERE id = $1 LIMIT 1`,
          [doetId]
        );
        if (doets && doets.length > 0 && doets[0].createdAt) {
          registrationDate = new Date(doets[0].createdAt);
        } else {
          // Fallback lấy createdAt của user enterprise thuộc doet này
          const users = await manager.query(
            `SELECT "createdAt" FROM users WHERE doet_id = $1 ORDER BY "createdAt" ASC LIMIT 1`,
            [doetId]
          );
          if (users && users.length > 0 && users[0].createdAt) {
            registrationDate = new Date(users[0].createdAt);
          }
        }
      } catch (err) {
        console.error("[findForEnterprise] Lỗi khi lấy ngày đăng ký DN:", err);
      }
    }

    // Lấy tất cả kỳ báo cáo ACTIVE cho năm được chọn
    const { year, status } = query;
    const qb = this.reportPeriodRepo.createQueryBuilder("rp");
    if (year) {
      qb.andWhere("rp.year = :year", { year: parseInt(year) });
    }
    if (status) {
      qb.andWhere("rp.status = :status", { status });
    }
    qb.orderBy("rp.start_date", "ASC");
    let allPeriods = await qb.getMany();

    // Filter: chỉ giữ lại kỳ báo cáo kể từ thời điểm doanh nghiệp tham gia hệ thống trở đi (endDate >= ngày đăng ký)
    if (registrationDate) {
      // Chuẩn hoá về đầu ngày để so sánh
      const regDay = new Date(registrationDate);
      regDay.setHours(0, 0, 0, 0);
      allPeriods = allPeriods.filter((p) => {
        const periodEnd = new Date(p.endDate);
        periodEnd.setHours(0, 0, 0, 0);
        return periodEnd >= regDay;
      });
    }

    // Kiểm tra kỳ nào đã được khai báo bởi doanh nghiệp
    const now = new Date();
    const periodsWithStatus = await Promise.all(
      allPeriods.map(async (p) => {
        let displayStatus: string = p.status; // 'ACTIVE' | 'INACTIVE'

        // Kiểm tra xem doanh nghiệp đã nộp báo cáo cho kỳ này chưa
        if (doetId) {
          try {
            const manager = getManager();
            const existingReport = await manager.findOne(PeriodicReport, {
              where: {
                doetId: String(doetId),
                year: p.year,
                period: p.period,
              }
            });

            if (existingReport) {
              // Đã khai báo: giữ displayStatus = ACTIVE (hoặc trạng thái thực của báo cáo)
              displayStatus = p.status;
            } else {
              // Chưa khai báo: kiểm tra có quá hạn không
              const periodEnd = new Date(p.endDate);
              if (periodEnd < now) {
                displayStatus = 'HET_HAN';
              }
            }
          } catch (err) {
            console.error("[findForEnterprise] Lỗi khi kiểm tra báo cáo DN:", err);
          }
        }

        return {
          ...p,
          displayStatus,
        };
      })
    );

    return { items: periodsWithStatus, totalCount: periodsWithStatus.length, registrationDate };
  }
}
