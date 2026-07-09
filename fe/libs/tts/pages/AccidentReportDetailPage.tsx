"use client";
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Breadcrumbs,
  Button,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';


export interface ReportData {
  tongSoVu: number;
  soVuChet: number;
  soVuTren2: number;
  tongNguoi: number;
  khongQlNguoiBiNan: number;
  nguoiNu: number;
  khongQlNuBiNan: number;
  chetTong: number;
  chetNgoai: number;
  thuongNangTong: number;
  thuongNangNgoai: number;
}

export interface ReportRow {
  id: string;
  code: string;
  name: string;
  isHeader: boolean;
  level: number;
  data?: ReportData;
}

import { useParams } from 'next/navigation';
import { DoetService, periodicReportService } from '@tts/services';

const fallbackCauses = [
  { id: 1, name: "Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn" },
  { id: 2, name: "Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt" },
  { id: 3, name: "Tổ chức lao động không hợp lý" },
  { id: 4, name: "Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ" },
  { id: 5, name: "Không có quy trình an toàn hoặc biện pháp làm việc an toàn" },
  { id: 6, name: "Điều kiện làm việc không tốt" },
  { id: 7, name: "Quy phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn" },
  { id: 8, name: "Không sử dụng phương tiện bảo vệ cá nhân" },
  { id: 9, name: "Khách quan khó tránh/ Nguyên nhân chưa kể đến" }
];

const fallbackOccupations = [
  { id: 1, name: "1 - Nhà lãnh đạo trong các ngành, các cấp và các đơn vị" },
  { id: 2, name: "11 - Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương và địa phương..." },
  { id: 3, name: "111 - Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương" },
  { id: 4, name: "1111 - Trưởng ban, Phó Trưởng ban và tương đương trở lên thuộc cấp Trung ương" }
];

const getAbsoluteFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3800/api/v1').replace('/api/v1', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatNumberWithDots = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '0';
  const raw = String(val).replace(/\./g, '');
  if (isNaN(Number(raw))) return '0';
  return Number(raw).toLocaleString('vi-VN');
};

export function AccidentReportDetailPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [injuryFactors, setInjuryFactors] = useState<any[]>([]);
  const [accidentCauses, setAccidentCauses] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  const causesList = accidentCauses.length > 0 ? accidentCauses : fallbackCauses;
  const occupationsList = occupations.length > 0 ? occupations : fallbackOccupations;
  const [costs, setCosts] = useState<any>(null);
  const [reportInfo, setReportInfo] = useState<{ year?: number, period?: string, fileUrl?: string, fileName?: string } | null>(null);
  const [rawReport, setRawReport] = useState<any>(null);
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const handleExportWord = async () => {
    if (!rawReport) return;
    try {
      const response = await fetch('/template.docx');
      if (!response.ok) throw new Error("Không thể tải template báo cáo");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const tnldSummary = rawReport.tnldSummary || {};
      const tnldTroCapSummary = rawReport.tnldTroCapSummary || {};

      const getDetailStats = (matches: any[]) => {
        const sum: any = {};
        matches.forEach((m: any) => {
          const s = m.stats || {};
          sum.tongSoVu = (sum.tongSoVu || 0) + Number(s.tongSoVu || 0);
          sum.tongSoVuNguoiChet = (sum.tongSoVuNguoiChet || 0) + Number(s.tongSoVuNguoiChet || 0);
          sum.tongSoVu2Nguoi = (sum.tongSoVu2Nguoi || 0) + Number(s.tongSoVu2NguoiTroLen || s.tongSoVu2Nguoi || 0);
          sum.tongSoNguoiBiNan = (sum.tongSoNguoiBiNan || 0) + Number(s.tongSoNguoiBiNan || 0);
          sum.tongSoNuBiNan = (sum.tongSoNuBiNan || 0) + Number(s.tongLaoDongNuBiNan ?? s.tongSoNuBiNan ?? 0);
          sum.soNguoiChet = (sum.soNguoiChet || 0) + Number(s.tongSoNguoiChet || s.soNguoiChet || 0);
          sum.soNguoiBiThuongNang = (sum.soNguoiBiThuongNang || 0) + Number(s.tongSoThuongNang || s.soNguoiBiThuongNang || 0);
          sum.khongQlNguoiBiNan = (sum.khongQlNguoiBiNan || 0) + Number(s.khongQlNguoiBiNan || 0);
          sum.khongQlNuBiNan = (sum.khongQlNuBiNan || 0) + Number(s.khongQlNuBiNan || 0);
          sum.khongQlNguoiChet = (sum.khongQlNguoiChet || 0) + Number(s.khongQlNguoiChet || 0);
          sum.khongQlNguoiBiThuongNang = (sum.khongQlNguoiBiThuongNang || 0) + Number(s.khongQlThuongNang || s.khongQlNguoiBiThuongNang || 0);
        });
        return sum;
      };

      const getStatCols = (stats: any, prefix: string) => {
        const o = {
          c3: formatNumberWithDots(stats?.tongSoVu || "0"),
          c4: formatNumberWithDots(stats?.tongSoVuNguoiChet || "0"),
          c5: formatNumberWithDots(stats?.tongSoVu2Nguoi || "0"),
          c6: formatNumberWithDots(stats?.tongSoNguoiBiNan || "0"),
          c7: formatNumberWithDots(stats?.tongSoNuBiNan || "0"),
          c8: formatNumberWithDots(stats?.soNguoiChet || "0"),
          c9: formatNumberWithDots(stats?.soNguoiBiThuongNang || "0"),
          c10: formatNumberWithDots(stats?.khongQlNguoiBiNan || "0"),
          c11: formatNumberWithDots(stats?.khongQlNuBiNan || "0"),
          c12: formatNumberWithDots(stats?.khongQlNguoiChet || "0"),
          c13: formatNumberWithDots(stats?.khongQlNguoiBiThuongNang || "0"),
        };
        if (!prefix) return o;
        const res: any = {};
        for (const [k, v] of Object.entries(o)) res[`${prefix}_${k}`] = v;
        return res;
      };

      const sourceDetails = rawReport.accidentDetails || [];
      const causesMapping: Record<number, string> = { 1: 'r8', 2: 'r9', 3: 'r10', 4: 'r11', 5: 'r12', 6: 'r13', 7: 'r15', 8: 'r16', 9: 'r17' };
      let causesData = {};
      for (let i = 1; i <= 9; i++) {
        const matches = sourceDetails.filter((d: any) => Number(d.nguyenNhanId) === i && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG'));
        causesData = { ...causesData, ...getStatCols(getDetailStats(matches), causesMapping[i]) };
      }

      const uniqueFactors = Array.from(new Set(sourceDetails.filter((d: any) => d.yeuToChanThuongId && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG')).map((d: any) => Number(d.yeuToChanThuongId))));
      const factors = uniqueFactors.map((id: any) => {
        const name = injuryFactors?.find((f: any) => f.id === id)?.name || (id === 101 ? 'Thiết bị nâng' : `Yếu tố ${id}`);
        const matches = sourceDetails.filter((d: any) => Number(d.yeuToChanThuongId) === id && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG'));
        return { name, code: String(id), ...getStatCols(getDetailStats(matches), '') };
      });

      const OCC_MAP: any = { 102: "Nhà lãnh đạo cơ quan Đảng Cộng sản Việt nam cấp Trung ương", 103: "Công nhân" };
      const uniqueOccs = Array.from(new Set(sourceDetails.filter((d: any) => d.ngheNghiepId && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG')).map((d: any) => Number(d.ngheNghiepId))));
      const occupations = uniqueOccs.map((id: any) => {
        const name = OCC_MAP[id] || `Nghề nghiệp ${id}`;
        const matches = sourceDetails.filter((d: any) => Number(d.ngheNghiepId) === id && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG'));
        return { name, code: String(id), ...getStatCols(getDetailStats(matches), '') };
      });

      const wardCodeStr = String(rawReport.company?.ward?.ma_phuong || rawReport.company?.ward?.code || rawReport.company?.ward?.key || rawReport.doet?.ward?.code || rawReport.doet?.ward?.key || "").padEnd(5, ' ');
      const typeCodeStr = String(rawReport.company?.loaiHinhKinhDoanh?.maloaihinh || rawReport.company?.loaiHinhKinhDoanh?.id || rawReport.doet?.loaiHinhKinhDoanh?.id || "").padEnd(4, ' ');
      const fieldCodeStr = String(rawReport.company?.businessLine?.manganh || rawReport.company?.businessLine?.code || rawReport.doet?.businessLine?.manganh || rawReport.doet?.businessLine?.code || "").padEnd(4, ' ');

      // Prepare data
      const data = {
        ...causesData,
        factors,
        occupations,
        companyName: rawReport.doet?.name || rawReport.company?.name || "",
        periodName: rawReport.period === 'CA_NAM' ? 'cả năm' : '6 tháng',
        reportYear: rawReport.year || "",
        reportDate: new Date().toLocaleDateString('vi-VN'),
        totalEmployees: rawReport.totalEmployees || "0",
        femaleEmployees: rawReport.femaleEmployees || "0",
        totalSalary: rawReport.totalSalaryFund || "0",
        companyAddress: rawReport.company?.address || rawReport.doet?.address || "",
        wC1: wardCodeStr[0], wC2: wardCodeStr[1], wC3: wardCodeStr[2], wC4: wardCodeStr[3], wC5: wardCodeStr[4],
        companyType: rawReport.company?.loaiHinhKinhDoanh?.tenloaihinh || rawReport.company?.loaiHinhKinhDoanh?.name || rawReport.doet?.loaiHinhKinhDoanh?.name || "",
        companyField: rawReport.company?.businessLine?.tennganh || rawReport.company?.businessLine?.name || rawReport.doet?.businessLine?.tennganh || rawReport.doet?.businessLine?.name || "",
        headOfEnterprise: rawReport.company?.headOfEnterprise || rawReport.doet?.headOfEnterprise || "",
        tC1: typeCodeStr[0], tC2: typeCodeStr[1], tC3: typeCodeStr[2], tC4: typeCodeStr[3],
        fC1: fieldCodeStr[0], fC2: fieldCodeStr[1], fC3: fieldCodeStr[2], fC4: fieldCodeStr[3],

        t1_c3: formatNumberWithDots(tnldSummary.tongSoVu || "0"),
        t1_c4: formatNumberWithDots(tnldSummary.tongSoVuNguoiChet || "0"),
        t1_c5: formatNumberWithDots(tnldSummary.tongSoVu2Nguoi || "0"),
        t1_c6: formatNumberWithDots(tnldSummary.tongSoNguoiBiNan || "0"),
        t1_c7: formatNumberWithDots(tnldSummary.tongLaoDongNuBiNan || "0"),
        t1_c8: formatNumberWithDots(tnldSummary.tongSoNguoiChet || "0"),
        t1_c9: formatNumberWithDots(tnldSummary.tongSoThuongNang || "0"),
        t1_c10: formatNumberWithDots(tnldSummary.khongQlNguoiBiNan || "0"),
        t1_c11: formatNumberWithDots(tnldSummary.khongQlNuBiNan || "0"),
        t1_c12: formatNumberWithDots(tnldSummary.khongQlNguoiChet || "0"),
        t1_c13: formatNumberWithDots(tnldSummary.khongQlThuongNang || "0"),

        t2_c3: formatNumberWithDots(tnldTroCapSummary.tongSoVu || "0"),
        t2_c4: formatNumberWithDots(tnldTroCapSummary.tongSoVuNguoiChet || "0"),
        t2_c5: formatNumberWithDots(tnldTroCapSummary.tongSoVu2Nguoi || "0"),
        t2_c6: formatNumberWithDots(tnldTroCapSummary.tongSoNguoiBiNan || "0"),
        t2_c7: formatNumberWithDots(tnldTroCapSummary.tongLaoDongNuBiNan || "0"),
        t2_c8: formatNumberWithDots(tnldTroCapSummary.tongSoNguoiChet || "0"),
        t2_c9: formatNumberWithDots(tnldTroCapSummary.tongSoThuongNang || "0"),
        t2_c10: formatNumberWithDots(tnldTroCapSummary.khongQlNguoiBiNan || "0"),
        t2_c11: formatNumberWithDots(tnldTroCapSummary.khongQlNuBiNan || "0"),
        t2_c12: formatNumberWithDots(tnldTroCapSummary.khongQlNguoiChet || "0"),
        t2_c13: formatNumberWithDots(tnldTroCapSummary.khongQlThuongNang || "0"),

        t3_c3: formatNumberWithDots(String(Number(tnldSummary.tongSoVu || 0) + Number(tnldTroCapSummary.tongSoVu || 0))),
        t3_c4: formatNumberWithDots(String(Number(tnldSummary.tongSoVuNguoiChet || 0) + Number(tnldTroCapSummary.tongSoVuNguoiChet || 0))),
        t3_c5: formatNumberWithDots(String(Number(tnldSummary.tongSoVu2Nguoi || 0) + Number(tnldTroCapSummary.tongSoVu2Nguoi || 0))),
        t3_c6: formatNumberWithDots(String(Number(tnldSummary.tongSoNguoiBiNan || 0) + Number(tnldTroCapSummary.tongSoNguoiBiNan || 0))),
        t3_c7: formatNumberWithDots(String(Number(tnldSummary.tongLaoDongNuBiNan || 0) + Number(tnldTroCapSummary.tongLaoDongNuBiNan || 0))),
        t3_c8: formatNumberWithDots(String(Number(tnldSummary.tongSoNguoiChet || 0) + Number(tnldTroCapSummary.tongSoNguoiChet || 0))),
        t3_c9: formatNumberWithDots(String(Number(tnldSummary.tongSoThuongNang || 0) + Number(tnldTroCapSummary.tongSoThuongNang || 0))),
        t3_c10: formatNumberWithDots(String(Number(tnldSummary.khongQlNguoiBiNan || 0) + Number(tnldTroCapSummary.khongQlNguoiBiNan || 0))),
        t3_c11: formatNumberWithDots(String(Number(tnldSummary.khongQlNuBiNan || 0) + Number(tnldTroCapSummary.khongQlNuBiNan || 0))),
        t3_c12: formatNumberWithDots(String(Number(tnldSummary.khongQlNguoiChet || 0) + Number(tnldTroCapSummary.khongQlNguoiChet || 0))),
        t3_c13: formatNumberWithDots(String(Number(tnldSummary.khongQlThuongNang || 0) + Number(tnldTroCapSummary.khongQlThuongNang || 0))),

        t4_c1: formatNumberWithDots(tnldSummary.tongNgayNghi || "0"),
        t4_c2: formatNumberWithDots(tnldSummary.tongChiPhi || "0"),
        t4_c3: formatNumberWithDots(tnldSummary.chiPhiYTe || "0"),
        t4_c4: formatNumberWithDots(tnldSummary.chiPhiTraLuong || "0"),
        t4_c5: formatNumberWithDots(tnldSummary.chiPhiBoiThuong || "0"),
        t4_c6: formatNumberWithDots(tnldSummary.thietHaiTaiSan || "0")
      };

      doc.render(data);
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(out, `Bao_cao_tai_nan_lao_dong_${rawReport.period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${rawReport.year}.docx`);
    } catch (error) {
      console.error("Export word error", error);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [response, factorsRes, causesRes, occRes]: any = await Promise.all([
          periodicReportService.getById(id),
          DoetService.getInjuryFactors(),
          DoetService.getAccidentCauses(),
          DoetService.getOccupations()
        ]);
        const report = response.data || response;
        setRawReport(report);
        const factors = factorsRes.data || factorsRes || [];
        setInjuryFactors(factors);

        const causes = causesRes?.data || causesRes || [];
        setAccidentCauses(causes);

        const occs = occRes?.data?.items || occRes?.data || occRes || [];
        if (Array.isArray(occs) && occs.length > 0) {
          const occsMapped = occs.map((o: any) => ({
            id: o.id,
            name: `${o.manghe} - ${o.tennghe}`
          }));
          setOccupations(occsMapped);
        }

        const mapData = (summary: any): ReportData => ({
          tongSoVu: summary?.tongSoVu || 0,
          soVuChet: summary?.tongSoVuNguoiChet || 0,
          soVuTren2: summary?.tongSoVu2NguoiTroLen || summary?.tongSoVu2Nguoi || 0,
          tongNguoi: summary?.tongSoNguoiBiNan || 0,
          khongQlNguoiBiNan: summary?.khongQlNguoiBiNan || 0,
          nguoiNu: summary?.tongLaoDongNuBiNan || summary?.tongSoNuBiNan || 0,
          khongQlNuBiNan: summary?.khongQlNuBiNan || 0,
          chetTong: summary?.tongSoNguoiChet || 0,
          chetNgoai: summary?.khongQlNguoiChet || 0,
          thuongNangTong: summary?.tongSoThuongNang || summary?.tongSoNguoiThuongNang || 0,
          thuongNangNgoai: summary?.khongQlThuongNang || 0,
        });

        const getSummedStatsForCause = (causeId: number) => {
          const matches = (report.accidentDetails || []).filter((d: any) => Number(d.nguyenNhanId) === causeId && d.reportType === 'TAI_NAN_LAO_DONG');
          if (matches.length === 0) return null;

          const sum: any = {};
          matches.forEach((m: any) => {
            const stats = m.stats || {};
            sum.tongSoVu = (sum.tongSoVu || 0) + Number(stats.tongSoVu || 0);
            sum.tongSoVuNguoiChet = (sum.tongSoVuNguoiChet || 0) + Number(stats.tongSoVuNguoiChet || 0);
            sum.tongSoVu2Nguoi = (sum.tongSoVu2Nguoi || 0) + Number(stats.tongSoVu2NguoiTroLen || stats.tongSoVu2Nguoi || 0);
            sum.tongSoNguoiBiNan = (sum.tongSoNguoiBiNan || 0) + Number(stats.tongSoNguoiBiNan || 0);
            sum.khongQlNguoiBiNan = (sum.khongQlNguoiBiNan || 0) + Number(stats.khongQlNguoiBiNan || 0);
            sum.tongLaoDongNuBiNan = (sum.tongLaoDongNuBiNan || 0) + Number(stats.tongLaoDongNuBiNan ?? stats.tongSoNuBiNan ?? 0);
            sum.khongQlNuBiNan = (sum.khongQlNuBiNan || 0) + Number(stats.khongQlNuBiNan || 0);
            sum.tongSoNguoiChet = (sum.tongSoNguoiChet || 0) + Number(stats.tongSoNguoiChet || 0);
            sum.khongQlNguoiChet = (sum.khongQlNguoiChet || 0) + Number(stats.khongQlNguoiChet || 0);
            sum.tongSoThuongNang = (sum.tongSoThuongNang || 0) + Number(stats.tongSoThuongNang || stats.tongSoNguoiThuongNang || 0);
            sum.khongQlThuongNang = (sum.khongQlThuongNang || 0) + Number(stats.khongQlThuongNang || 0);
          });
          return mapData(sum);
        };

        const tnld = mapData(report.tnldSummary);
        const troCap = mapData(report.tnldTroCapSummary);

        const rows: ReportRow[] = [
          { id: "1", code: "", name: "1. Tai nạn lao động", isHeader: true, level: 0 },
          { id: "1-0", code: "", name: "Tai nạn lao động", isHeader: false, level: 0, data: tnld },

          { id: "1.1", code: "", name: "1.1 Phân theo nguyên nhân xảy ra TNLĐ", isHeader: true, level: 0 },
          { id: "1.1-a", code: "", name: "a. Do người sử dụng lao động", isHeader: true, level: 0 },
        ];

        causesList.slice(0, 6).forEach((c, i) => {
          const stats = getSummedStatsForCause(c.id);
          if (stats) {
            rows.push({ id: `1.1-a-${c.id}`, code: String(i + 1), name: c.name, isHeader: false, level: 0, data: stats });
          }
        });

        rows.push({ id: "1.1-b", code: "", name: "b. Do người lao động", isHeader: true, level: 0 });
        causesList.slice(6, 8).forEach((c, i) => {
          const stats = getSummedStatsForCause(c.id);
          if (stats) {
            rows.push({ id: `1.1-b-${c.id}`, code: String(i + 7), name: c.name, isHeader: false, level: 0, data: stats });
          }
        });

        const otherStats = getSummedStatsForCause(9);
        if (otherStats) {
          rows.push({ id: "1.1-9", code: "9", name: causesList[8].name, isHeader: false, level: 0, data: otherStats });
        }

        rows.push({ id: "1.2", code: "", name: "1.2. Phân theo yếu tố gây chấn thương", isHeader: true, level: 0 });
        const uniqueYeuToIds = Array.from(new Set(
          (report.accidentDetails || [])
            .filter((d: any) => d.yeuToChanThuongId && d.reportType === 'TAI_NAN_LAO_DONG')
            .map((d: any) => Number(d.yeuToChanThuongId))
        ));

        uniqueYeuToIds.forEach((factorId) => {
          const matches = (report.accidentDetails || []).filter((d: any) => Number(d.yeuToChanThuongId) === factorId && d.reportType === 'TAI_NAN_LAO_DONG');
          const sum: any = {};
          matches.forEach((m: any) => {
            const stats = m.stats || {};
            sum.tongSoVu = (sum.tongSoVu || 0) + Number(stats.tongSoVu || 0);
            sum.tongSoVuNguoiChet = (sum.tongSoVuNguoiChet || 0) + Number(stats.tongSoVuNguoiChet || 0);
            sum.tongSoVu2Nguoi = (sum.tongSoVu2Nguoi || 0) + Number(stats.tongSoVu2NguoiTroLen || stats.tongSoVu2Nguoi || 0);
            sum.tongSoNguoiBiNan = (sum.tongSoNguoiBiNan || 0) + Number(stats.tongSoNguoiBiNan || 0);
            sum.khongQlNguoiBiNan = (sum.khongQlNguoiBiNan || 0) + Number(stats.khongQlNguoiBiNan || 0);
            sum.tongLaoDongNuBiNan = (sum.tongLaoDongNuBiNan || 0) + Number(stats.tongLaoDongNuBiNan ?? stats.tongSoNuBiNan ?? 0);
            sum.khongQlNuBiNan = (sum.khongQlNuBiNan || 0) + Number(stats.khongQlNuBiNan || 0);
            sum.tongSoNguoiChet = (sum.tongSoNguoiChet || 0) + Number(stats.tongSoNguoiChet || 0);
            sum.khongQlNguoiChet = (sum.khongQlNguoiChet || 0) + Number(stats.khongQlNguoiChet || 0);
            sum.tongSoThuongNang = (sum.tongSoThuongNang || 0) + Number(stats.tongSoThuongNang || stats.tongSoNguoiThuongNang || 0);
            sum.khongQlThuongNang = (sum.khongQlThuongNang || 0) + Number(stats.khongQlThuongNang || 0);
          });
          const factorInfo = factors.find((f: any) => f.id === factorId);
          const name = factorInfo?.name || `Yếu tố ${factorId}`;
          rows.push({ id: `1.2-${factorId}`, code: String(factorId), name, isHeader: false, level: 0, data: mapData(sum) });
        });

        rows.push({ id: "1.3", code: "", name: "1.3 Phân theo nghề nghiệp", isHeader: true, level: 0 });
        const uniqueNgheNghiepIds = Array.from(new Set(
          (report.accidentDetails || [])
            .filter((d: any) => d.ngheNghiepId && d.reportType === 'TAI_NAN_LAO_DONG')
            .map((d: any) => Number(d.ngheNghiepId))
        ));

        uniqueNgheNghiepIds.forEach((occId) => {
          const matches = (report.accidentDetails || []).filter((d: any) => Number(d.ngheNghiepId) === occId && d.reportType === 'TAI_NAN_LAO_DONG');
          const sum: any = {};
          matches.forEach((m: any) => {
            const stats = m.stats || {};
            sum.tongSoVu = (sum.tongSoVu || 0) + Number(stats.tongSoVu || 0);
            sum.tongSoVuNguoiChet = (sum.tongSoVuNguoiChet || 0) + Number(stats.tongSoVuNguoiChet || 0);
            sum.tongSoVu2Nguoi = (sum.tongSoVu2Nguoi || 0) + Number(stats.tongSoVu2NguoiTroLen || stats.tongSoVu2Nguoi || 0);
            sum.tongSoNguoiBiNan = (sum.tongSoNguoiBiNan || 0) + Number(stats.tongSoNguoiBiNan || 0);
            sum.khongQlNguoiBiNan = (sum.khongQlNguoiBiNan || 0) + Number(stats.khongQlNguoiBiNan || 0);
            sum.tongLaoDongNuBiNan = (sum.tongLaoDongNuBiNan || 0) + Number(stats.tongLaoDongNuBiNan ?? stats.tongSoNuBiNan ?? 0);
            sum.khongQlNuBiNan = (sum.khongQlNuBiNan || 0) + Number(stats.khongQlNuBiNan || 0);
            sum.tongSoNguoiChet = (sum.tongSoNguoiChet || 0) + Number(stats.tongSoNguoiChet || 0);
            sum.khongQlNguoiChet = (sum.khongQlNguoiChet || 0) + Number(stats.khongQlNguoiChet || 0);
            sum.tongSoThuongNang = (sum.tongSoThuongNang || 0) + Number(stats.tongSoThuongNang || stats.tongSoNguoiThuongNang || 0);
            sum.khongQlThuongNang = (sum.khongQlThuongNang || 0) + Number(stats.khongQlThuongNang || 0);
          });
          const occInfo = occupationsList.find(o => o.id === occId);
          const name = occInfo?.name || `Nghề nghiệp ${occId}`;
          rows.push({ id: `1.3-${occId}`, code: String(occId), name, isHeader: false, level: 0, data: mapData(sum) });
        });

        const sumData = (a: ReportData, b: ReportData): ReportData => ({
          tongSoVu: a.tongSoVu + b.tongSoVu,
          soVuChet: a.soVuChet + b.soVuChet,
          soVuTren2: a.soVuTren2 + b.soVuTren2,
          tongNguoi: a.tongNguoi + b.tongNguoi,
          khongQlNguoiBiNan: a.khongQlNguoiBiNan + b.khongQlNguoiBiNan,
          nguoiNu: a.nguoiNu + b.nguoiNu,
          khongQlNuBiNan: a.khongQlNuBiNan + b.khongQlNuBiNan,
          chetTong: a.chetTong + b.chetTong,
          chetNgoai: a.chetNgoai + b.chetNgoai,
          thuongNangTong: a.thuongNangTong + b.thuongNangTong,
          thuongNangNgoai: a.thuongNangNgoai + b.thuongNangNgoai,
        });

        rows.push({ id: "2", code: "", name: "2. Tai nạn được hưởng trợ cấp theo quy định tại Khoản 2 Điều 39 Luật ATVSLĐ", isHeader: true, level: 0 });
        rows.push({ id: "2-0", code: "10", name: "", isHeader: false, level: 0, data: troCap });

        rows.push({ id: "3", code: "", name: "3. Tổng số", isHeader: true, level: 0 });
        rows.push({ id: "3-0", code: "", name: "Tổng số (3=1+2)", isHeader: false, level: 0, data: sumData(tnld, troCap) });

        setData(rows);
        setCosts(report.tnldSummary);
        setReportInfo({ year: report.year, period: report.period, fileUrl: report.reportFileUrl, fileName: report.reportFileName });
      } catch (error) {
        console.error("Lỗi tải chi tiết báo cáo:", error);
      }
    };

    fetchData();
  }, [id]);

  const renderDataValue = (value?: any) => {
    if (value === undefined || value === null || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('vi-VN');
  };

  const cellStyle = { border: '1px solid #e2e8f0', borderColor: '#e2e8f0' };
  const headStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#475569' };

  return (
    <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          px: 3,
          py: 1.5
        }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
            Báo cáo định kỳ Tai nạn lao động
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => router.push('/accident-reports')}
              sx={{
                textTransform: 'none',
                color: '#666',
                fontSize: '0.85rem',
                borderRadius: '6px',
                padding: '4px 16px',
                minWidth: 'auto',
                backgroundColor: 'transparent',
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#f5f5f7',
                  color: '#333',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)'
                }
              }}
            >
              Huỷ bỏ
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              sx={{ color: '#2f65f0', borderColor: '#2f65f0' }}
              onClick={() => handleExportWord()}
            >
              In báo cáo
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              backgroundColor: '#fff',
              p: 3,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
            }}
          >

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {reportInfo?.period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm {reportInfo?.year || 2023}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography sx={{ color: 'red', fontWeight: 'bold', mr: 0.5 }}>**</Typography>
              <Typography sx={{ mr: 2, color: '#475569' }}>
                Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty:
              </Typography>
              {reportInfo?.fileUrl ? (
                <MuiLink
                  href={getAbsoluteFileUrl(reportInfo.fileUrl)}
                  target="_blank"
                  underline="always"
                  sx={{ color: '#3b82f6' }}
                >
                  {reportInfo.fileName || reportInfo.fileUrl.split('/').pop() || 'Tệp đính kèm'}
                </MuiLink>
              ) : (
                <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  (Chưa có file đính kèm)
                </Typography>
              )}
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <Table stickyHeader aria-label="dynamic report table" sx={{ minWidth: 1200 }}>

                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={4} align="center" sx={headStyle}>Tên chỉ tiêu thống kê</TableCell>
                    <TableCell rowSpan={4} align="center" sx={{ ...headStyle, width: 80 }}>Mã số</TableCell>
                    <TableCell colSpan={11} align="center" sx={headStyle}>Phân loại TNLĐ theo mức độ thương tật</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Số vụ (Vụ)</TableCell>
                    <TableCell colSpan={8} align="center" sx={headStyle}>Số người bị nạn (Người)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Số vụ có người chết</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Số vụ có từ 2 người bị nạn trở lên</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Số LĐ nữ</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Số người bị chết</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Số người bị thương nặng</TableCell>
                  </TableRow>
                  <TableRow>
                    {/* Tổng số */}
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                    {/* Số LĐ nữ */}
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                    {/* Số người chết */}
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                    {/* Thương nặng */}
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.map((row) => {
                    const dynamicPaddingLeft = `${row.level * 24 + 16}px`;

                    if (row.isHeader) {
                      return (
                        <TableRow key={row.id} sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell
                            colSpan={13}
                            sx={{
                              fontWeight: 'bold',
                              paddingLeft: dynamicPaddingLeft,
                              ...cellStyle
                            }}
                          >
                            {row.name}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ paddingLeft: dynamicPaddingLeft, ...cellStyle }}>
                          {row.name}
                        </TableCell>

                        <TableCell align="center" sx={cellStyle}>
                          {row.code}
                        </TableCell>

                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongSoVu)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.soVuChet)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.soVuTren2)}</TableCell>

                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongNguoi)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.khongQlNguoiBiNan)}</TableCell>

                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.nguoiNu)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.khongQlNuBiNan)}</TableCell>

                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chetTong)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chetNgoai)}</TableCell>

                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.thuongNangTong)}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.thuongNangNgoai)}</TableCell>
                      </TableRow>
                    );
                  })}

                  {costs && (
                    <>
                      <TableRow>
                        <TableCell colSpan={13} sx={{ ...headStyle, textAlign: 'left', pl: 2, fontSize: '1rem' }}>
                          II. Thiệt hại do tai nạn lao động
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} rowSpan={3} align="center" sx={headStyle}>
                          Tổng số ngày nghỉ vì tai nạn lao động (kể cả ngày nghỉ chế độ)
                        </TableCell>
                        <TableCell colSpan={7} align="center" sx={headStyle}>
                          Tổng số ngày nghỉ vì TNLĐ (1.000đ)
                        </TableCell>
                        <TableCell colSpan={3} rowSpan={3} align="center" sx={headStyle}>
                          Thiệt hại tài sản<br />(1.000đ)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={1} rowSpan={2} align="center" sx={headStyle}>Tổng số</TableCell>
                        <TableCell colSpan={6} align="center" sx={headStyle}>Khoảng chi cụ thể của cơ sở</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={headStyle}>Y tế</TableCell>
                        <TableCell colSpan={2} align="center" sx={headStyle}>Trả lương trong thời gian điều trị</TableCell>
                        <TableCell colSpan={2} align="center" sx={headStyle}>Bồi thường trợ cấp</TableCell>
                      </TableRow>
                      <TableRow hover>
                        <TableCell colSpan={3} align="center" sx={cellStyle}>{renderDataValue(costs.tongNgayNghi)}</TableCell>
                        <TableCell colSpan={1} align="center" sx={cellStyle}>{renderDataValue(costs.tongChiPhi)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{renderDataValue(costs.chiPhiYTe)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{renderDataValue(costs.chiPhiTraLuong)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{renderDataValue(costs.chiPhiBoiThuong)}</TableCell>
                        <TableCell colSpan={3} align="center" sx={cellStyle}>{renderDataValue(costs.thietHaiTaiSan)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
  );
}
