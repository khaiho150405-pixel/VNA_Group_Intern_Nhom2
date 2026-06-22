import { BadRequestException, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PeriodicReport } from "./periodic-report.entity";
import { AccidentDetail } from "./accident-detail.entity";
import { Doet } from "../doet/doet.entity";
import * as fs from "fs";
import * as path from "path";
import Response from "../../commons/response";
import { BaseService } from "src/commons";

@Injectable()
export class PeriodicReportService extends BaseService<PeriodicReport> implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(PeriodicReport)
    private readonly reportRepo: Repository<PeriodicReport>,
    @InjectRepository(AccidentDetail)
    private readonly detailRepo: Repository<AccidentDetail>,
    @InjectRepository(Doet)
    private readonly doetRepo: Repository<Doet>
  ) {
    super(reportRepo, (data) => Object.assign(new PeriodicReport(), data));
  }

  async onApplicationBootstrap() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    try {
      const sqlPath = path.resolve(process.cwd(), 'src/sql/periodic-reports.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await this.reportRepo.query(sql);
        console.log("== [Seed] periodic-reports: Đã chạy file SQL ==");
      }
    } catch (error) {
      console.error("== [Seed] Lỗi khi chạy periodic-reports.sql ==", error);
    }
  }

  async findAllReports(currentUser: any, query: any) {
    const roleType = currentUser?.role?.type;
    const isSoUser = roleType === 'SO';
    const doetId = currentUser?.doet || currentUser?.doet_id;

    const {
      year,
      period,
      status,
      companyName,
      taxCode,
      provinceId,
      provinceName,
      wardId,
      wardName,
      page = 1,
      limit = 10
    } = query || {};

    if (isSoUser) {
      const doetQb = this.doetRepo.createQueryBuilder("d")
        .leftJoinAndSelect("d.businessLine", "bl")
        .leftJoinAndSelect("d.loaiHinhKinhDoanh", "lh");

      if (companyName) {
        doetQb.andWhere("d.name ILIKE :companyName", { companyName: `%${companyName}%` });
      }
      if (taxCode) {
        doetQb.andWhere("d.taxCode ILIKE :taxCode", { taxCode: `%${taxCode}%` });
      }
      if (provinceId) {
        doetQb.andWhere("d.province ->> 'key' = :provinceId", { provinceId });
      } else if (provinceName) {
        doetQb.andWhere("d.province ->> 'value' ILIKE :provinceName", { provinceName: `%${provinceName}%` });
      }
      if (wardId) {
        doetQb.andWhere("d.ward ->> 'key' = :wardId", { wardId });
      } else if (wardName) {
        doetQb.andWhere("d.ward ->> 'value' ILIKE :wardName", { wardName: `%${wardName}%` });
      }

      const doets = await doetQb.getMany();
      let allPossibleReports: any[] = [];
      const filterYear = parseInt(year || new Date().getFullYear());

      for (const d of doets) {
        const periods = period ? [period] : ['6_THANG', 'CA_NAM'];
        for (const p of periods) {
          allPossibleReports.push({
            doetId: d.id,
            companyName: d.name,
            taxCode: d.taxCode,
            period: p,
            year: filterYear,
            doet: d
          });
        }
      }

      const existingReports = await this.reportRepo.find({
        where: { year: filterYear },
        relations: ["accidentDetails"]
      });

      let finalItems = allPossibleReports.map(rep => {
        const match = existingReports.find(r => String(r.doetId) === String(rep.doetId) && r.period === rep.period);
        return {
          id: match?.id || `virtual_${rep.doetId}_${rep.period}`,
          doetId: rep.doetId,
          year: rep.year,
          period: rep.period,
          status: match?.status || 'CHO_BAO_CAO',
          companyName: rep.companyName,
          taxCode: rep.taxCode,
          doet: rep.doet,
          reportData: match || null
        };
      });

      if (status) {
        finalItems = finalItems.filter(item => item.status === status);
      }

      const totalCount = finalItems.length;
      const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
      const take = parseInt(limit as any);
      const items = finalItems.slice(skip, skip + take);

      return Response.get({ items, totalCount, page: parseInt(page as any), limit: parseInt(limit as any) });
    } else {
      const qb = this.reportRepo.createQueryBuilder("pr")
        .leftJoin(Doet, "d", "pr.doetId = CAST(d.id AS varchar)");

      if (doetId) {
        qb.where("pr.doetId = :doetId", { doetId: String(doetId) });
      } else {
        qb.where("pr.doetId = :doetId", { doetId: 'non_existent_doet_id' });
      }

      if (year) {
        qb.andWhere("pr.year = :year", { year: parseInt(year) });
      }
      if (period) {
        qb.andWhere("pr.period = :period", { period });
      }
      if (status) {
        qb.andWhere("pr.status = :status", { status });
      }

      qb.orderBy("pr.createdAt", "DESC");
      const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
      const take = parseInt(limit as any);
      qb.skip(skip).take(take);

      const [items, totalCount] = await qb.getManyAndCount();
      return Response.get({ items, totalCount, page: parseInt(page as any), limit: parseInt(limit as any) });
    }
  }

  async getSummaryReport(currentUser: any, query: any) {
    const roleType = currentUser?.role?.type;
    const isSoUser = roleType === 'SO';
    const doetId = currentUser?.doet || currentUser?.doet_id;

    const {
      year,
      period,
      status,
      companyName,
      taxCode,
      provinceId,
      provinceName,
      wardId,
      wardName
    } = query || {};

    const qb = this.reportRepo.createQueryBuilder("pr")
      .leftJoin(Doet, "d", "pr.doetId = CAST(d.id AS varchar)")
      .leftJoinAndSelect("pr.accidentDetails", "ad");

    if (!isSoUser) {
      if (doetId) {
        qb.where("pr.doetId = :doetId", { doetId: String(doetId) });
      } else {
        qb.where("pr.doetId = :doetId", { doetId: 'non_existent_doet_id' });
      }
    } else {
      qb.where("1 = 1");
    }

    if (year) {
      qb.andWhere("pr.year = :year", { year: parseInt(year) });
    }

    if (period) {
      qb.andWhere("pr.period = :period", { period });
    }

    if (status) {
      qb.andWhere("pr.status = :status", { status });
    }

    if (companyName) {
      qb.andWhere("(pr.companyName ILIKE :companyName OR d.name ILIKE :companyName)", { companyName: `%${companyName}%` });
    }

    if (taxCode) {
      qb.andWhere("d.taxCode ILIKE :taxCode", { taxCode: `%${taxCode}%` });
    }

    if (provinceId) {
      qb.andWhere("d.province ->> 'key' = :provinceId", { provinceId });
    } else if (provinceName) {
      qb.andWhere("d.province ->> 'value' ILIKE :provinceName", { provinceName: `%${provinceName}%` });
    }

    if (wardId) {
      qb.andWhere("d.ward ->> 'key' = :wardId", { wardId });
    } else if (wardName) {
      qb.andWhere("d.ward ->> 'value' ILIKE :wardName", { wardName: `%${wardName}%` });
    }

    const reports = await qb.getMany();

    let totalEmployees = 0;
    let femaleEmployees = 0;
    let totalSalaryFund = 0;

    const aggregatedTnldSummary: any = {};
    const aggregatedTnldTroCapSummary: any = {};

    const fields = [
      'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoVu2NguoiTroLen',
      'tongSoNguoiBiNan', 'tongSoNuBiNan', 'tongLaoDongNuBiNan', 'tongSoNguoiChet',
      'tongSoThuongNang', 'tongSoNguoiThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan',
      'khongQlNguoiChet', 'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong',
      'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi', 'thietHaiTaiSan'
    ];

    fields.forEach(f => {
      aggregatedTnldSummary[f] = 0;
      aggregatedTnldTroCapSummary[f] = 0;
    });

    const detailGroups = new Map<string, {
      reportType: string;
      nguyenNhanId: number | null;
      yeuToChanThuongId: number | null;
      ngheNghiepId: number | null;
      stats: any;
    }>();

    for (const r of reports) {
      totalEmployees += Number(r.totalEmployees || 0);
      femaleEmployees += Number(r.femaleEmployees || 0);
      totalSalaryFund += Number(r.totalSalaryFund || 0);

      if (r.tnldSummary) {
        for (const key of Object.keys(r.tnldSummary)) {
          const val = Number(r.tnldSummary[key] || 0);
          if (!isNaN(val)) {
            aggregatedTnldSummary[key] = (aggregatedTnldSummary[key] || 0) + val;
          }
        }
      }

      if (r.tnldTroCapSummary) {
        for (const key of Object.keys(r.tnldTroCapSummary)) {
          const val = Number(r.tnldTroCapSummary[key] || 0);
          if (!isNaN(val)) {
            aggregatedTnldTroCapSummary[key] = (aggregatedTnldTroCapSummary[key] || 0) + val;
          }
        }
      }

      if (r.accidentDetails && Array.isArray(r.accidentDetails)) {
        for (const ad of r.accidentDetails) {
          const nCause = ad.nguyenNhanId !== undefined && ad.nguyenNhanId !== null ? ad.nguyenNhanId : null;
          const nInjury = ad.yeuToChanThuongId !== undefined && ad.yeuToChanThuongId !== null ? ad.yeuToChanThuongId : null;
          const nOcc = ad.ngheNghiepId !== undefined && ad.ngheNghiepId !== null ? ad.ngheNghiepId : null;

          const key = `${ad.reportType}_${nCause || 0}_${nInjury || 0}_${nOcc || 0}`;

          if (!detailGroups.has(key)) {
            const statsInit: any = {};
            fields.forEach(f => statsInit[f] = 0);
            detailGroups.set(key, {
              reportType: ad.reportType,
              nguyenNhanId: nCause,
              yeuToChanThuongId: nInjury,
              ngheNghiepId: nOcc,
              stats: statsInit
            });
          }

          const group = detailGroups.get(key)!;
          if (ad.stats) {
            for (const sKey of Object.keys(ad.stats)) {
              const val = Number(ad.stats[sKey] || 0);
              if (!isNaN(val)) {
                group.stats[sKey] = (group.stats[sKey] || 0) + val;
              }
            }
          }
        }
      }
    }

    const accidentDetailsList = Array.from(detailGroups.values());

    return Response.get({
      year: year ? parseInt(year) : null,
      period: period || null,
      totalEmployees,
      femaleEmployees,
      totalSalaryFund,
      tnldSummary: aggregatedTnldSummary,
      tnldTroCapSummary: aggregatedTnldTroCapSummary,
      accidentDetails: accidentDetailsList,
      reportCount: reports.length
    });
  }

  async findDetail(id: number) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ["accidentDetails"]
    });
    if (!report) throw Response.errorNotFound("Không tìm thấy báo cáo");
    return Response.get(report);
  }

  async createReport(payload: any) {
    const status = payload.status || 'DA_TIEP_NHAN';
    if (status === 'DA_TIEP_NHAN') {
      if (!payload.reportFileUrl) throw new BadRequestException("Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty");
    }
    if (payload.totalEmployees === undefined || payload.totalEmployees === null || payload.totalEmployees === '') throw new BadRequestException("Tổng số lao động là bắt buộc");
    if (payload.femaleEmployees === undefined || payload.femaleEmployees === null || payload.femaleEmployees === '') throw new BadRequestException("Tổng số lao động nữ là bắt buộc");
    if (payload.totalSalaryFund === undefined || payload.totalSalaryFund === null || payload.totalSalaryFund === '') throw new BadRequestException("Tổng quỹ lương là bắt buộc");

    if (payload.totalEmployees < 0 || payload.femaleEmployees < 0 || payload.totalSalaryFund < 0) {
      throw new BadRequestException("Dữ liệu không được là số âm");
    }

    if (payload.femaleEmployees > payload.totalEmployees) {
      throw new BadRequestException("Số lao động nữ không được lớn hơn tổng số lao động");
    }

    if (payload.tnldSummary) {
      this.validateSummaryAndDetails(payload.tnldSummary, payload.accidentDetails, 'TAI_NAN_LAO_DONG', 'TNLĐ: ', false);
    }
    if (payload.tnldTroCapSummary) {
      this.validateSummaryAndDetails(payload.tnldTroCapSummary, payload.accidentDetails, 'TAI_NAN_LAO_DONG_TRO_CAP', 'Trợ cấp: ', true);
    }

    if (payload.doetId && !isNaN(+payload.doetId)) {
      const doet = await this.doetRepo.findOne({
        where: { id: +payload.doetId },
        relations: ["businessLine", "loaiHinhKinhDoanh"]
      });
      if (doet) {
        payload.companyName = doet.name;
        if (doet.businessLine) payload.businessLineId = doet.businessLine.id;
        if (doet.loaiHinhKinhDoanh) payload.companyTypeId = doet.loaiHinhKinhDoanh.id;
      }
    }

    payload.status = status;
    const report = this.reportRepo.create(payload);
    const saved = await this.reportRepo.save(report);
    return Response.get(saved);
  }

  async put(currentUser: any, id: any, payload: any): Promise<any> {
    const status = payload.status || 'DA_TIEP_NHAN';
    if (status === 'DA_TIEP_NHAN') {
      if (!payload.reportFileUrl) throw new BadRequestException("Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty");
    }
    const currentReport = await this.reportRepo.findOne({ where: { id } });
    if (!currentReport) throw new BadRequestException("Không tìm thấy báo cáo");
    if (currentReport.status === 'DA_TIEP_NHAN') throw new BadRequestException("Báo cáo đã được tiếp nhận, không thể chỉnh sửa");

    const total = payload.totalEmployees !== undefined ? payload.totalEmployees : currentReport.totalEmployees;
    const female = payload.femaleEmployees !== undefined ? payload.femaleEmployees : currentReport.femaleEmployees;

    if (female > total) {
      throw new BadRequestException("Số lao động nữ không được lớn hơn tổng số lao động");
    }

    if (payload.tnldSummary) {
      this.validateSummaryAndDetails(payload.tnldSummary, payload.accidentDetails, 'TAI_NAN_LAO_DONG', 'TNLĐ: ', false);
    }
    if (payload.tnldTroCapSummary) {
      this.validateSummaryAndDetails(payload.tnldTroCapSummary, payload.accidentDetails, 'TAI_NAN_LAO_DONG_TRO_CAP', 'Trợ cấp: ', true);
    }

    // Không cho phép frontend tự override tên công ty
    if (payload.doetId && !isNaN(+payload.doetId)) {
      const doet = await this.doetRepo.findOne({
        where: { id: +payload.doetId },
        relations: ["businessLine", "loaiHinhKinhDoanh"]
      });
      if (doet) {
        payload.companyName = doet.name;
        if (doet.businessLine) payload.businessLineId = doet.businessLine.id;
        if (doet.loaiHinhKinhDoanh) payload.companyTypeId = doet.loaiHinhKinhDoanh.id;
      }
    }

    payload.status = status;
    return super.put(currentUser, id, payload);
  }

  private validateLogicalConstraints(stats: any, prefixMsg: string = '') {
    const tongVu = parseInt(stats.tongSoVu || 0);
    const tongVuChet = parseInt(stats.tongSoVuNguoiChet || 0);
    const tongVu2Nguoi = parseInt(stats.tongSoVu2Nguoi || 0);

    const tongNguoiNan = parseInt(stats.tongSoNguoiBiNan || 0);
    const tongNuNan = parseInt(stats.tongSoNuBiNan || 0);
    const tongNguoiChet = parseInt(stats.tongSoNguoiChet || 0);
    const tongThuongNang = parseInt(stats.tongSoThuongNang || 0);

    const khongQlNan = parseInt(stats.khongQlNguoiBiNan || 0);
    const khongQlNuNan = parseInt(stats.khongQlNuBiNan || 0);
    const khongQlChet = parseInt(stats.khongQlNguoiChet || 0);
    const khongQlThuongNang = parseInt(stats.khongQlThuongNang || 0);

    const chiPhiYTe = parseFloat(stats.chiPhiYTe || 0);
    const chiPhiTraLuong = parseFloat(stats.chiPhiTraLuong || 0);
    const chiPhiBoiThuong = parseFloat(stats.chiPhiBoiThuong || 0);
    const tongChiPhi = parseFloat(stats.tongChiPhi || 0);

    if (tongChiPhi !== (chiPhiYTe + chiPhiTraLuong + chiPhiBoiThuong)) {
      throw new BadRequestException(`${prefixMsg}Tổng chi phí phải bằng tổng của Chi phí y tế, Chi phí trả lương và Chi phí bồi thường`);
    }

    if (tongVuChet > tongVu) throw new BadRequestException(`${prefixMsg}Tổng số vụ có người chết không được lớn hơn Tổng số vụ`);
    if (tongVu2Nguoi > tongVu) throw new BadRequestException(`${prefixMsg}Tổng số vụ có 2 người bị nạn trở lên không được lớn hơn Tổng số vụ`);

    if (tongNuNan > tongNguoiNan) throw new BadRequestException(`${prefixMsg}Tổng số lao động nữ bị nạn không được lớn hơn Tổng số người bị nạn`);
    if (tongNguoiChet + tongThuongNang > tongNguoiNan) throw new BadRequestException(`${prefixMsg}Tổng số người chết và bị thương nặng không được vượt quá Tổng số người bị nạn`);

    if (khongQlNan > tongNguoiNan) throw new BadRequestException(`${prefixMsg}Số người bị nạn không QL không được lớn hơn Tổng số người bị nạn`);
    if (khongQlNuNan > tongNuNan) throw new BadRequestException(`${prefixMsg}Lao động nữ bị nạn không QL không được lớn hơn Tổng số LĐ nữ bị nạn`);
    if (khongQlChet > tongNguoiChet) throw new BadRequestException(`${prefixMsg}Số người chết không QL không được lớn hơn Tổng số người chết`);
    if (khongQlThuongNang > tongThuongNang) throw new BadRequestException(`${prefixMsg}Người bị thương nặng không QL không được lớn hơn Tổng số người bị thương nặng`);
    if (khongQlChet + khongQlThuongNang > khongQlNan) throw new BadRequestException(`${prefixMsg}Tổng người chết và thương nặng không QL không được lớn hơn Số người bị nạn không QL`);
  }

  private validateSummaryAndDetails(summary: any, accidentDetails: any[], reportType: string, prefixMsg: string = '', allowDefaultZero: boolean = false) {
    const requiredSummaryFields = [
      'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi',
      'tongSoNguoiBiNan', 'tongSoNuBiNan', 'tongSoNguoiChet', 'tongSoThuongNang',
      'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet', 'khongQlThuongNang',
      'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi'
    ];
    for (const field of requiredSummaryFields) {
      if (summary[field] === undefined || summary[field] === null || summary[field] === '') {
        if (!allowDefaultZero) throw new BadRequestException(`${prefixMsg}Vui lòng nhập đầy đủ dữ liệu bắt buộc`);
        summary[field] = 0;
      }
      if (parseFloat(summary[field]) < 0) {
        throw new BadRequestException(`${prefixMsg}Dữ liệu không được là số âm`);
      }
    }
    if (summary.thietHaiTaiSan !== undefined && summary.thietHaiTaiSan !== null && summary.thietHaiTaiSan !== '') {
      if (parseFloat(summary.thietHaiTaiSan) < 0) {
        throw new BadRequestException(`${prefixMsg}Thiệt hại tài sản không được là số âm`);
      }
    }

    this.validateLogicalConstraints(summary, prefixMsg);

    const tongVu = parseInt(summary.tongSoVu || 0);
    const tongVuChet = parseInt(summary.tongSoVuNguoiChet || 0);
    const tongVu2Nguoi = parseInt(summary.tongSoVu2Nguoi || 0);
    const tongNguoiNan = parseInt(summary.tongSoNguoiBiNan || 0);
    const tongNuNan = parseInt(summary.tongSoNuBiNan || 0);
    const tongNguoiChet = parseInt(summary.tongSoNguoiChet || 0);
    const tongThuongNang = parseInt(summary.tongSoThuongNang || 0);
    const khongQlNan = parseInt(summary.khongQlNguoiBiNan || 0);
    const khongQlNuNan = parseInt(summary.khongQlNuBiNan || 0);
    const khongQlChet = parseInt(summary.khongQlNguoiChet || 0);
    const khongQlThuongNang = parseInt(summary.khongQlThuongNang || 0);
    const chiPhiYTe = parseFloat(summary.chiPhiYTe || 0);
    const chiPhiTraLuong = parseFloat(summary.chiPhiTraLuong || 0);
    const chiPhiBoiThuong = parseFloat(summary.chiPhiBoiThuong || 0);

    if (accidentDetails && Array.isArray(accidentDetails)) {
      let sumVu = 0, sumVuChet = 0, sumVu2Nguoi = 0;
      let sumNguoiNan = 0, sumNuNan = 0, sumNguoiChet = 0, sumThuongNang = 0;
      let sumKqNan = 0, sumKqNuNan = 0, sumKqChet = 0, sumKqThuongNang = 0;
      let sumYTe = 0, sumTraLuong = 0, sumBoiThuong = 0, sumNgayNghi = 0, sumTaiSan = 0;

      for (const detail of accidentDetails) {
        if (detail.reportType === reportType && detail.stats) {
          const reqStatsFields = [
            'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi',
            'tongSoNguoiBiNan', 'tongSoNuBiNan', 'tongSoNguoiChet', 'tongSoThuongNang',
            'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet', 'khongQlThuongNang',
            'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi'
          ];
          for (const field of reqStatsFields) {
            if (detail.stats[field] === undefined || detail.stats[field] === null || detail.stats[field] === '') {
              if (!allowDefaultZero) throw new BadRequestException(`${prefixMsg}Chi tiết: Vui lòng nhập đầy đủ dữ liệu bắt buộc`);
              detail.stats[field] = 0;
            }
            if (parseFloat(detail.stats[field]) < 0) {
              throw new BadRequestException(`${prefixMsg}Chi tiết: Dữ liệu không được là số âm`);
            }
          }
          if (detail.stats.thietHaiTaiSan !== undefined && detail.stats.thietHaiTaiSan !== null && detail.stats.thietHaiTaiSan !== '') {
            if (parseFloat(detail.stats.thietHaiTaiSan) < 0) {
              throw new BadRequestException(`${prefixMsg}Chi tiết: Thiệt hại tài sản không được là số âm`);
            }
          }

          this.validateLogicalConstraints(detail.stats, prefixMsg + "Chi tiết: ");

          sumVu += parseInt(detail.stats.tongSoVu || 0);
          sumVuChet += parseInt(detail.stats.tongSoVuNguoiChet || 0);
          sumVu2Nguoi += parseInt(detail.stats.tongSoVu2Nguoi || 0);
          sumNguoiNan += parseInt(detail.stats.tongSoNguoiBiNan || 0);
          sumNuNan += parseInt(detail.stats.tongSoNuBiNan || 0);
          sumNguoiChet += parseInt(detail.stats.tongSoNguoiChet || 0);
          sumThuongNang += parseInt(detail.stats.tongSoThuongNang || 0);
          sumKqNan += parseInt(detail.stats.khongQlNguoiBiNan || 0);
          sumKqNuNan += parseInt(detail.stats.khongQlNuBiNan || 0);
          sumKqChet += parseInt(detail.stats.khongQlNguoiChet || 0);
          sumKqThuongNang += parseInt(detail.stats.khongQlThuongNang || 0);
          sumYTe += parseFloat(detail.stats.chiPhiYTe || 0);
          sumTraLuong += parseFloat(detail.stats.chiPhiTraLuong || 0);
          sumBoiThuong += parseFloat(detail.stats.chiPhiBoiThuong || 0);
          sumNgayNghi += parseInt(detail.stats.tongNgayNghi || 0);
          sumTaiSan += parseFloat(detail.stats.thietHaiTaiSan || 0);
        }
      }

      if (tongVu > 0) {
        if (sumVu !== tongVu) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng số vụ không khớp với Tổng kết`);
        if (sumVuChet !== tongVuChet) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng số vụ có người chết không khớp`);
        if (sumVu2Nguoi !== tongVu2Nguoi) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng số vụ 2 người nạn không khớp`);
        if (sumNguoiNan !== tongNguoiNan) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng số người bị nạn không khớp`);
        if (sumNuNan !== tongNuNan) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng lao động nữ bị nạn không khớp`);
        if (sumNguoiChet !== tongNguoiChet) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng người chết không khớp`);
        if (sumThuongNang !== tongThuongNang) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng thương nặng không khớp`);
        if (sumKqNan !== khongQlNan) throw new BadRequestException(`${prefixMsg}Chi tiết: Nạn nhân không QL không khớp`);
        if (sumKqNuNan !== khongQlNuNan) throw new BadRequestException(`${prefixMsg}Chi tiết: Nữ không QL không khớp`);
        if (sumKqChet !== khongQlChet) throw new BadRequestException(`${prefixMsg}Chi tiết: Người chết không QL không khớp`);
        if (sumKqThuongNang !== khongQlThuongNang) throw new BadRequestException(`${prefixMsg}Chi tiết: Thương nặng không QL không khớp`);
        if (sumYTe !== chiPhiYTe) throw new BadRequestException(`${prefixMsg}Chi tiết: Chi phí y tế không khớp`);
        if (sumTraLuong !== chiPhiTraLuong) throw new BadRequestException(`${prefixMsg}Chi tiết: Chi phí trả lương không khớp`);
        if (sumBoiThuong !== chiPhiBoiThuong) throw new BadRequestException(`${prefixMsg}Chi tiết: Chi phí bồi thường không khớp`);
        if (sumNgayNghi !== parseInt(summary.tongNgayNghi || 0)) throw new BadRequestException(`${prefixMsg}Chi tiết: Tổng ngày nghỉ không khớp`);
        const summaryTaiSan = summary.thietHaiTaiSan ? parseFloat(summary.thietHaiTaiSan) : 0;
        if (sumTaiSan !== summaryTaiSan) throw new BadRequestException(`${prefixMsg}Chi tiết: Thiệt hại tài sản không khớp`);
      }
    }
  }
}
