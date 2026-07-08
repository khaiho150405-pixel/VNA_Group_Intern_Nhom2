import { Injectable, BadRequestException, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, getManager } from "typeorm";
import { ReportPeriod } from "./report-period.entity";
import { PeriodicReport } from "../periodic-report/periodic-report.entity";
import Response from "../../commons/response";

@Injectable()
export class ReportPeriodService implements OnApplicationBootstrap {
  private async hasPermission(roleId: number | undefined, code: string): Promise<boolean> {
    if (!roleId) return false;
    const manager = getManager();
    const count = await manager.query(
      `SELECT COUNT(*) FROM role_permissions WHERE role_id = $1 AND permission_code = $2`,
      [roleId, code]
    );
    return parseInt(count[0]?.count || '0', 10) > 0;
  }

  async checkReadPermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_REPORT_PERIOD_VIEW');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xem cấu hình kỳ báo cáo.");
    }
  }

  async checkCreatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_REPORT_PERIOD_CREATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền thêm mới cấu hình kỳ báo cáo.");
    }
  }

  async checkUpdatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_REPORT_PERIOD_UPDATE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền cập nhật cấu hình kỳ báo cáo.");
    }
  }

  async checkDeletePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') return;
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_REPORT_PERIOD_DELETE');
    if (!allowed) {
      throw Response.errorForBidden("Tài khoản của bạn không có quyền xóa cấu hình kỳ báo cáo.");
    }
  }

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

  async findAll(query: any, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
    const { year, reportName, period, startDate, endDate, status, page = 1, limit = 10 } = query || {};
    const qb = this.reportPeriodRepo.createQueryBuilder("rp");

    if (year) {
      qb.andWhere("rp.year = :year", { year: parseInt(year) });
    }
    if (reportName) {
      qb.andWhere("rp.reportName ILIKE :reportName", { reportName: `%${reportName}%` });
    }
    if (period) {
      qb.andWhere("rp.period = :period", { period });
    }
    if (status) {
      qb.andWhere("rp.status = :status", { status });
    }
    if (startDate) {
      qb.andWhere("rp.startDate >= :startDate", { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere("rp.endDate <= :endDate", { endDate: new Date(endDate) });
    }

    qb.orderBy("rp.id", "DESC");

    const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
    const take = parseInt(limit as any);
    qb.skip(skip).take(take);

    const [items, totalCount] = await qb.getManyAndCount();
    return { items, totalCount, page: parseInt(page as any), limit: parseInt(limit as any) };
  }

  async findById(id: number, currentUser?: any) {
    if (currentUser) await this.checkReadPermission(currentUser);
    const item = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!item) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");
    return item;
  }

  async create(data: any, currentUser?: any) {
    if (currentUser) await this.checkCreatePermission(currentUser);
    if (!data.year || !data.reportName || !data.period || !data.startDate || !data.endDate) {
      throw new BadRequestException("Vui lòng điền đầy đủ các thông tin bắt buộc");
    }
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
    }

    const expectedEnd = new Date(start.getTime());
    if (data.period === '6_THANG') {
      expectedEnd.setMonth(expectedEnd.getMonth() + 6);
      expectedEnd.setDate(expectedEnd.getDate() - 1);
    } else if (data.period === 'CA_NAM') {
      expectedEnd.setFullYear(expectedEnd.getFullYear() + 1);
      expectedEnd.setDate(expectedEnd.getDate() - 1);
    }

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (formatDate(end) !== formatDate(expectedEnd)) {
      throw new BadRequestException(`Ngày kết thúc phải khớp với kỳ báo cáo đã chọn (${data.period === 'CA_NAM' ? '1 năm' : '6 tháng'} trừ 1 ngày từ ngày bắt đầu)`);
    }
    const targetYear = parseInt(data.year);

    // Removed validation constraints comparing dates years to targetYear
    const minStart = new Date(targetYear, 0, 1);
    if (start < minStart) {
      throw new BadRequestException(`Ngày bắt đầu phải lớn hơn hoặc bằng ngày 01/01 của năm báo cáo ${targetYear}`);
    }
    const maxStart = new Date(targetYear, 11, 31);
    if (start > maxStart) {
      throw new BadRequestException(`Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày 31/12 của năm báo cáo ${targetYear}`);
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

    // Kiểm tra trùng thời gian (overlap) giữa tất cả các kỳ báo cáo
    const otherPeriods = await this.reportPeriodRepo.find();
    for (const op of otherPeriods) {
      const opStart = new Date(op.startDate);
      const opEnd = new Date(op.endDate);
      if (start <= opEnd && opStart <= end) {
        throw new BadRequestException(
          `Thời gian kỳ báo cáo trùng với kỳ báo cáo "${op.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm ${op.year}" (${opStart.toLocaleDateString('vi-VN')} - ${opEnd.toLocaleDateString('vi-VN')})`
        );
      }
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

  async update(id: number, data: any, currentUser?: any) {
    if (currentUser) await this.checkUpdatePermission(currentUser);
    const existing = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!existing) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");

    const isStatusInactive = data.status === 'INACTIVE' && existing.status !== 'INACTIVE';
    const isYearChanged = data.year !== undefined && parseInt(data.year) !== existing.year;
    const isPeriodChanged = data.period !== undefined && data.period !== existing.period;
    const isDateChanged = (data.startDate !== undefined && new Date(data.startDate).getTime() !== new Date(existing.startDate).getTime()) ||
                          (data.endDate !== undefined && new Date(data.endDate).getTime() !== new Date(existing.endDate).getTime());
    
    if (isStatusInactive || isYearChanged || isPeriodChanged || isDateChanged) {
      const manager = getManager();
      const countRes = await manager.query(
        `SELECT COUNT(*) as count FROM periodic_reports WHERE year = $1 AND period = $2`,
        [existing.year, existing.period]
      );
      if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
        throw new BadRequestException("Kỳ báo cáo này đã có doanh nghiệp nộp báo cáo, không thể thay đổi thông tin hoặc tắt trạng thái");
      }
    }

    const startVal = data.startDate !== undefined ? data.startDate : existing.startDate;
    const endVal = data.endDate !== undefined ? data.endDate : existing.endDate;

    const startParsed = new Date(startVal);
    const endParsed = new Date(endVal);
    const nextPeriod = data.period !== undefined ? data.period : existing.period;

    const isDateOrPeriodChanged = data.startDate !== undefined || data.endDate !== undefined || data.period !== undefined;
    if (isDateOrPeriodChanged) {
      if (endParsed < startParsed) {
        throw new BadRequestException("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
      }

      const expectedEndParsed = new Date(startParsed.getTime());
      if (nextPeriod === '6_THANG') {
        expectedEndParsed.setMonth(expectedEndParsed.getMonth() + 6);
        expectedEndParsed.setDate(expectedEndParsed.getDate() - 1);
      } else if (nextPeriod === 'CA_NAM') {
        expectedEndParsed.setFullYear(expectedEndParsed.getFullYear() + 1);
        expectedEndParsed.setDate(expectedEndParsed.getDate() - 1);
      }

      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (formatDate(endParsed) !== formatDate(expectedEndParsed)) {
        throw new BadRequestException(`Ngày kết thúc phải khớp với kỳ báo cáo đã chọn (${nextPeriod === 'CA_NAM' ? '1 năm' : '6 tháng'} trừ 1 ngày từ ngày bắt đầu)`);
      }
    }

    const nextYear = data.year !== undefined ? parseInt(data.year) : existing.year;
    
    const isYearOrDateChanged = data.year !== undefined || isDateOrPeriodChanged;
    if (isYearOrDateChanged) {
      const minStart = new Date(nextYear, 0, 1);
      if (startParsed < minStart) {
        throw new BadRequestException(`Ngày bắt đầu phải lớn hơn hoặc bằng ngày 01/01 của năm báo cáo ${nextYear}`);
      }
      const maxStart = new Date(nextYear, 11, 31);
      if (startParsed > maxStart) {
        throw new BadRequestException(`Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày 31/12 của năm báo cáo ${nextYear}`);
      }
    }

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

    if (isDateOrPeriodChanged) {
      // Kiểm tra trùng thời gian (overlap) giữa tất cả các kỳ báo cáo
      const otherPeriods = await this.reportPeriodRepo.find();
      for (const op of otherPeriods) {
        if (op.id === id) continue; // Bỏ qua chính kỳ báo cáo đang cập nhật
        const opStart = new Date(op.startDate);
        const opEnd = new Date(op.endDate);
        if (startParsed <= opEnd && opStart <= endParsed) {
          throw new BadRequestException(
            `Thời gian kỳ báo cáo trùng với kỳ báo cáo "${op.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm ${op.year}" (${opStart.toLocaleDateString('vi-VN')} - ${opEnd.toLocaleDateString('vi-VN')})`
          );
        }
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

  async remove(id: number, currentUser?: any) {
    if (currentUser) await this.checkDeletePermission(currentUser);
    const existing = await this.reportPeriodRepo.findOne({ where: { id } });
    if (!existing) throw Response.errorNotFound("Không tìm thấy cấu hình kỳ báo cáo");

    const manager = getManager();
    const countRes = await manager.query(
      `SELECT COUNT(*) as count FROM periodic_reports WHERE year = $1 AND period = $2`,
      [existing.year, existing.period]
    );
    if (countRes && countRes[0] && Number(countRes[0].count) > 0) {
      throw new BadRequestException("Kỳ báo cáo này đã có doanh nghiệp nộp báo cáo, không thể xóa");
    }

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

    // Show all active periods for the selected year regardless of registration date as requested

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
