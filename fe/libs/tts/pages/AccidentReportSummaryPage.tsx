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
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { MainLayout } from '@core/layouts/MainLayout';

interface ReportData {
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

interface ReportRow {
  id: string;
  code?: string;
  name: string;
  isHeader?: boolean;
  level: number;
  data?: ReportData;
}

import { useParams } from 'next/navigation';
import { periodicReportService, DoetService } from '@tts/services';

const formatNumberWithDots = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '0';
  const raw = String(val).replace(/\./g, '');
  if (isNaN(Number(raw))) return '0';
  return Number(raw).toLocaleString('vi-VN');
};

export function AccidentReportSummaryPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [injuryFactors, setInjuryFactors] = useState<any[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [reportInfo, setReportInfo] = useState<{ year?: number, period?: string, totalReports?: number } | null>(null);
  const [rawReport, setRawReport] = useState<any>(null);
  const searchParams = useSearchParams();
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

      // Prepare data
      const data = {
        ...causesData,
        factors,
        occupations,
        companyName: "Sở Lao động - Thương binh và Xã hội",
        periodName: rawReport.period === 'CA_NAM' ? 'cả năm' : '6 tháng',
        reportYear: rawReport.year || "",
        reportDate: new Date().toLocaleDateString('vi-VN'),
        totalEmployees: "",
        femaleEmployees: "",
        totalSalary: "",
        companyAddress: "",
        addressCode: "",
        companyType: "",
        typeCode: "",
        companyField: "Tổng hợp",
        fieldCode: "",
        headOfEnterprise: "",

        t1_c3: formatNumberWithDots(tnldSummary.tongSoVu || "0"),
        t1_c4: formatNumberWithDots(tnldSummary.tongSoVuNguoiChet || "0"),
        t1_c5: formatNumberWithDots(tnldSummary.tongSoVu2Nguoi || tnldSummary.tongSoVu2NguoiTroLen || "0"),
        t1_c6: formatNumberWithDots(tnldSummary.tongSoNguoiBiNan || "0"),
        t1_c7: formatNumberWithDots(tnldSummary.tongLaoDongNuBiNan || tnldSummary.tongSoNuBiNan || "0"),
        t1_c8: formatNumberWithDots(tnldSummary.tongSoNguoiChet || tnldSummary.soNguoiChet || "0"),
        t1_c9: formatNumberWithDots(tnldSummary.tongSoThuongNang || tnldSummary.soNguoiBiThuongNang || "0"),
        t1_c10: formatNumberWithDots(tnldSummary.khongQlNguoiBiNan || "0"),
        t1_c11: formatNumberWithDots(tnldSummary.khongQlNuBiNan || "0"),
        t1_c12: formatNumberWithDots(tnldSummary.khongQlNguoiChet || "0"),
        t1_c13: formatNumberWithDots(tnldSummary.khongQlThuongNang || tnldSummary.khongQlNguoiBiThuongNang || "0"),

        t2_c3: formatNumberWithDots(tnldTroCapSummary.tongSoVu || "0"),
        t2_c4: formatNumberWithDots(tnldTroCapSummary.tongSoVuNguoiChet || "0"),
        t2_c5: formatNumberWithDots(tnldTroCapSummary.tongSoVu2Nguoi || tnldTroCapSummary.tongSoVu2NguoiTroLen || "0"),
        t2_c6: formatNumberWithDots(tnldTroCapSummary.tongSoNguoiBiNan || "0"),
        t2_c7: formatNumberWithDots(tnldTroCapSummary.tongLaoDongNuBiNan || tnldTroCapSummary.tongSoNuBiNan || "0"),
        t2_c8: formatNumberWithDots(tnldTroCapSummary.tongSoNguoiChet || tnldTroCapSummary.soNguoiChet || "0"),
        t2_c9: formatNumberWithDots(tnldTroCapSummary.tongSoThuongNang || tnldTroCapSummary.soNguoiBiThuongNang || "0"),
        t2_c10: formatNumberWithDots(tnldTroCapSummary.khongQlNguoiBiNan || "0"),
        t2_c11: formatNumberWithDots(tnldTroCapSummary.khongQlNuBiNan || "0"),
        t2_c12: formatNumberWithDots(tnldTroCapSummary.khongQlNguoiChet || "0"),
        t2_c13: formatNumberWithDots(tnldTroCapSummary.khongQlThuongNang || tnldTroCapSummary.khongQlNguoiBiThuongNang || "0"),

        t3_c3: formatNumberWithDots(String(Number(tnldSummary.tongSoVu || 0) + Number(tnldTroCapSummary.tongSoVu || 0))),
        t3_c4: formatNumberWithDots(String(Number(tnldSummary.tongSoVuNguoiChet || 0) + Number(tnldTroCapSummary.tongSoVuNguoiChet || 0))),
        t3_c5: formatNumberWithDots(String(Number(tnldSummary.tongSoVu2Nguoi || tnldSummary.tongSoVu2NguoiTroLen || 0) + Number(tnldTroCapSummary.tongSoVu2Nguoi || tnldTroCapSummary.tongSoVu2NguoiTroLen || 0))),
        t3_c6: formatNumberWithDots(String(Number(tnldSummary.tongSoNguoiBiNan || 0) + Number(tnldTroCapSummary.tongSoNguoiBiNan || 0))),
        t3_c7: formatNumberWithDots(String(Number(tnldSummary.tongLaoDongNuBiNan || tnldSummary.tongSoNuBiNan || 0) + Number(tnldTroCapSummary.tongLaoDongNuBiNan || tnldTroCapSummary.tongSoNuBiNan || 0))),
        t3_c8: formatNumberWithDots(String(Number(tnldSummary.tongSoNguoiChet || tnldSummary.soNguoiChet || 0) + Number(tnldTroCapSummary.tongSoNguoiChet || tnldTroCapSummary.soNguoiChet || 0))),
        t3_c9: formatNumberWithDots(String(Number(tnldSummary.tongSoThuongNang || tnldSummary.soNguoiBiThuongNang || 0) + Number(tnldTroCapSummary.tongSoThuongNang || tnldTroCapSummary.soNguoiBiThuongNang || 0))),
        t3_c10: formatNumberWithDots(String(Number(tnldSummary.khongQlNguoiBiNan || 0) + Number(tnldTroCapSummary.khongQlNguoiBiNan || 0))),
        t3_c11: formatNumberWithDots(String(Number(tnldSummary.khongQlNuBiNan || 0) + Number(tnldTroCapSummary.khongQlNuBiNan || 0))),
        t3_c12: formatNumberWithDots(String(Number(tnldSummary.khongQlNguoiChet || 0) + Number(tnldTroCapSummary.khongQlNguoiChet || 0))),
        t3_c13: formatNumberWithDots(String(Number(tnldSummary.khongQlThuongNang || tnldSummary.khongQlNguoiBiThuongNang || 0) + Number(tnldTroCapSummary.khongQlThuongNang || tnldTroCapSummary.khongQlNguoiBiThuongNang || 0))),

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
      saveAs(out, `Bao_cao_tong_hop_${rawReport.period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${rawReport.year}.docx`);
    } catch (error) {
      console.error("Export word error", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const [response, factorsRes]: any = await Promise.all([
          periodicReportService.getSummary(queryParams),
          DoetService.getInjuryFactors()
        ]);
        const report = response.data || response;
        setRawReport(report);
        const factors = factorsRes.data || factorsRes || [];
        setInjuryFactors(factors);

        const mapData = (summary: any): ReportData => ({
          tongSoVu: summary?.tongSoVu || 0,
          soVuChet: summary?.tongSoVuNguoiChet || 0,
          soVuTren2: summary?.tongSoVu2NguoiTroLen || summary?.tongSoVu2Nguoi || 0,
          tongNguoi: summary?.tongSoNguoiBiNan || 0,
          khongQlNguoiBiNan: summary?.khongQlNguoiBiNan || 0,
          nguoiNu: summary?.tongLaoDongNuBiNan || summary?.tongSoNuBiNan || 0,
          khongQlNuBiNan: summary?.khongQlNuBiNan || 0,
          chetTong: summary?.soNguoiChet || 0,
          chetNgoai: summary?.khongQlNguoiChet || 0,
          thuongNangTong: summary?.soNguoiBiThuongNang || 0,
          thuongNangNgoai: summary?.khongQlNguoiBiThuongNang || 0,
        });

        const getDetailByNguyenNhan = (id: number) => {
          if (!report.accidentDetails) return {};
          const detail = report.accidentDetails.find((d: any) => d.nguyenNhanId === id);
          return detail ? detail.stats : {};
        };

        const getDetailByChanThuong = (id: number) => {
          if (!report.accidentDetails) return {};
          const detail = report.accidentDetails.find((d: any) => d.yeuToChanThuongId === id);
          return detail ? detail.stats : {};
        };

        const getDetailByNgheNghiep = (id: number) => {
          if (!report.accidentDetails) return {};
          const detail = report.accidentDetails.find((d: any) => d.ngheNghiepId === id);
          return detail ? detail.stats : {};
        };

        const rows: ReportRow[] = [
          // HEADER: 1
          { id: 'h-1', name: '1. Tai nạn lao động', level: 0, isHeader: true },

          // HEADER: 1.1
          { id: 'h-1-1', name: '1.1 Theo nguyên nhân', level: 1, isHeader: true },
          // a. Người sử dụng
          { id: 'h-1-1-a', name: 'a. Do người sử dụng lao động', level: 2, isHeader: true },
          { id: '1', code: '1', name: '- Do tổ chức điều kiện LĐ', level: 3, data: mapData(getDetailByNguyenNhan(1)) },
          { id: '2', code: '2', name: '- Do thiếu sót các thiết bị, phương tiện BVCN', level: 3, data: mapData(getDetailByNguyenNhan(2)) },
          { id: '3', code: '3', name: '- Không huấn luyện an toàn, VSLĐ', level: 3, data: mapData(getDetailByNguyenNhan(3)) },
          // b. Người lao động
          { id: 'h-1-1-b', name: 'b. Do người lao động', level: 2, isHeader: true },
          { id: '4', code: '4', name: '- Vi phạm quy trình, nội quy, BP an toàn LĐ', level: 3, data: mapData(getDetailByNguyenNhan(4)) },
          { id: '5', code: '5', name: '- Không sử dụng các thiết bị bảo vệ cá nhân', level: 3, data: mapData(getDetailByNguyenNhan(5)) },
          // c. Khác
          { id: 'h-1-1-c', name: 'c. Do các nguyên nhân khác', level: 2, isHeader: true },
          { id: '6', code: '6', name: '- TN giao thông liên quan đến LĐ', level: 3, data: mapData(getDetailByNguyenNhan(6)) },
          { id: '7', code: '7', name: '- Khách quan', level: 3, data: mapData(getDetailByNguyenNhan(7)) },
          { id: '8', code: '8', name: '- Chữa cháy, cứu hộ', level: 3, data: mapData(getDetailByNguyenNhan(8)) },
          { id: '9', code: '9', name: '- Khác (Ghi rõ)', level: 3, data: mapData(getDetailByNguyenNhan(9)) },

          // HEADER: 1.2
          { id: 'h-1-2', name: '1.2 Phân loại TNLĐ theo yếu tố chấn thương', level: 1, isHeader: true },
          { id: '101', code: '101', name: '- Thiết bị nâng', level: 2, data: mapData(getDetailByChanThuong(101)) },

          // HEADER: 1.3
          { id: 'h-1-3', name: '1.3 Phân loại TNLĐ theo nghề nghiệp người bị nạn', level: 1, isHeader: true },
          { id: '102', code: '102', name: '- Nhà lãnh đạo', level: 2, data: mapData(getDetailByNgheNghiep(102)) },
          { id: '103', code: '103', name: '- Công nhân', level: 2, data: mapData(getDetailByNgheNghiep(103)) },

          // 2. TNLĐ được hưởng chế độ
          { id: 'h-2', name: '2. Tai nạn được hưởng chế độ trợ cấp TNLĐ', level: 0, isHeader: true },
          { id: '201', code: '201', name: '- TNLĐ được hưởng chế độ', level: 1, data: mapData(report.tnldTroCapSummary) },

          // 3. Tổng số
          { id: 'h-3', name: '3. Tổng số (3=1+2)', level: 0, isHeader: true },
          {
            id: '301', code: '301', name: '- Tổng', level: 1, data: {
              tongSoVu: (report.tnldSummary?.tongSoVu || 0) + (report.tnldTroCapSummary?.tongSoVu || 0),
              soVuChet: (report.tnldSummary?.tongSoVuNguoiChet || 0) + (report.tnldTroCapSummary?.tongSoVuNguoiChet || 0),
              soVuTren2: (report.tnldSummary?.tongSoVu2Nguoi || 0) + (report.tnldTroCapSummary?.tongSoVu2Nguoi || 0),
              tongNguoi: (report.tnldSummary?.tongSoNguoiBiNan || 0) + (report.tnldTroCapSummary?.tongSoNguoiBiNan || 0),
              khongQlNguoiBiNan: (report.tnldSummary?.khongQlNguoiBiNan || 0) + (report.tnldTroCapSummary?.khongQlNguoiBiNan || 0),
              nguoiNu: (report.tnldSummary?.tongSoNuBiNan || 0) + (report.tnldTroCapSummary?.tongSoNuBiNan || 0),
              khongQlNuBiNan: (report.tnldSummary?.khongQlNuBiNan || 0) + (report.tnldTroCapSummary?.khongQlNuBiNan || 0),
              chetTong: (report.tnldSummary?.soNguoiChet || 0) + (report.tnldTroCapSummary?.soNguoiChet || 0),
              chetNgoai: (report.tnldSummary?.khongQlNguoiChet || 0) + (report.tnldTroCapSummary?.khongQlNguoiChet || 0),
              thuongNangTong: (report.tnldSummary?.soNguoiBiThuongNang || 0) + (report.tnldTroCapSummary?.soNguoiBiThuongNang || 0),
              thuongNangNgoai: (report.tnldSummary?.khongQlNguoiBiThuongNang || 0) + (report.tnldTroCapSummary?.khongQlNguoiBiThuongNang || 0),
            }
          },
        ];

        setData(rows);
        setCosts(report.tnldSummary);
        setReportInfo({ year: report.year, period: report.period, totalReports: report.reportCount });
      } catch (error) {
        console.error("Lỗi tải báo cáo tổng hợp:", error);
      }
    };
    fetchData();
  }, [searchParams]);

  const renderDataValue = (value?: any) => {
    if (value === undefined || value === null || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('vi-VN');
  };

  const cellStyle = { border: '1px solid #e2e8f0', borderColor: '#e2e8f0' };
  const headStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#475569' };

  return (
    <MainLayout>
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
            Báo cáo tổng hợp toàn cơ quan
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ color: '#64748b', borderColor: '#cbd5e1', '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' } }}
              onClick={() => router.push('/accident-reports')}
            >
              Huỷ bỏ
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              sx={{ color: '#059669', borderColor: '#a7f3d0' }}
              onClick={() => handleExportWord()}
            >
              Xuất báo cáo
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

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Báo cáo tổng hợp tình hình tai nạn lao động
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              Dữ liệu được tổng hợp từ {reportInfo?.totalReports || 0} báo cáo thành phần.
            </Typography>

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
    </MainLayout>
  );
}
