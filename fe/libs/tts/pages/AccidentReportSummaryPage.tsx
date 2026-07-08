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
  tongNgayNghi?: number;
  chiPhiYTe?: number;
  chiPhiTraLuong?: number;
  chiPhiBoiThuong?: number;
  tongChiPhi?: number;
  thietHaiTaiSan?: number;
}

interface ReportRow {
  id: string;
  code?: string;
  name: string;
  isHeader?: boolean;
  level: number;
  data?: ReportData;
}

interface LoaiHinhStat {
  loaiHinh: any;
  reportCount: number;
  totalEmployees: number;
  femaleEmployees: number;
  tnldSummary: any;
  tnldTroCapSummary: any;
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
  const [loaiHinhStats, setLoaiHinhStats] = useState<LoaiHinhStat[]>([]);
  const [loaiHinhs, setLoaiHinhs] = useState<any[]>([]);
  const [injuryFactors, setInjuryFactors] = useState<any[]>([]);
  const [accidentCauses, setAccidentCauses] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [reportInfo, setReportInfo] = useState<{ year?: number, period?: string, totalReports?: number } | null>(null);
  const [rawReport, setRawReport] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleExportWord = async () => {
    if (!rawReport) return;
    try {
      const response = await fetch('/template_summary.docx');
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

          sum.tongNgayNghi = (sum.tongNgayNghi || 0) + Number(s.tongNgayNghi || 0);
          sum.chiPhiYTe = (sum.chiPhiYTe || 0) + Number(s.chiPhiYTe || 0);
          sum.chiPhiTraLuong = (sum.chiPhiTraLuong || 0) + Number(s.chiPhiTraLuong || 0);
          sum.chiPhiBoiThuong = (sum.chiPhiBoiThuong || 0) + Number(s.chiPhiBoiThuong || 0);
          sum.tongChiPhi = (sum.tongChiPhi || 0) + Number(s.tongChiPhi || 0);
          sum.thietHaiTaiSan = (sum.thietHaiTaiSan || 0) + Number(s.thietHaiTaiSan || 0);
        });
        return sum;
      };

      const getStatCols = (stats: any, prefix: string) => {
        const o = {
          c3: formatNumberWithDots(stats?.tongSoVu || "0"),
          c4: formatNumberWithDots(stats?.tongSoVuNguoiChet || "0"),
          c5: formatNumberWithDots(stats?.tongSoVu2Nguoi || stats?.tongSoVu2NguoiTroLen || "0"),
          c6: formatNumberWithDots(stats?.tongSoNguoiBiNan || "0"),
          c7: formatNumberWithDots(stats?.tongLaoDongNuBiNan ?? stats?.tongSoNuBiNan ?? "0"),
          c8: formatNumberWithDots(stats?.tongSoNguoiChet || stats?.soNguoiChet || "0"),
          c9: formatNumberWithDots(stats?.tongSoThuongNang || stats?.soNguoiBiThuongNang || "0"),
          c10: formatNumberWithDots(stats?.tongNgayNghi || "0"),
          c11: formatNumberWithDots(stats?.chiPhiYTe || "0"),
          c12: formatNumberWithDots(stats?.chiPhiTraLuong || "0"),
          c13: formatNumberWithDots(stats?.chiPhiBoiThuong || "0"),
          c14: formatNumberWithDots(stats?.thietHaiTaiSan || "0"),
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

      const OCC_MAP: Record<number, string> = {};
      const currentOccs = occupations.length > 0 ? occupations : [
        { id: 1, name: "1 - Nhà lãnh đạo trong các ngành, các cấp và các đơn vị" },
        { id: 2, name: "11 - Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương và địa phương..." },
        { id: 3, name: "111 - Nhà lãnh đạo cơ quan Đảng Cộng sản Việt Nam cấp Trung ương" },
        { id: 4, name: "1111 - Trưởng ban, Phó Trưởng ban và tương đương trở lên thuộc cấp Trung ương" }
      ];
      currentOccs.forEach((o: any) => {
        OCC_MAP[o.id] = o.name;
      });
      const uniqueOccs = Array.from(new Set(sourceDetails.filter((d: any) => d.ngheNghiepId && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG')).map((d: any) => Number(d.ngheNghiepId))));
      const occupationsExport = uniqueOccs.map((id: any) => {
        const name = OCC_MAP[id] || `Nghề nghiệp ${id}`;
        const matches = sourceDetails.filter((d: any) => Number(d.ngheNghiepId) === id && (!d.reportType || d.reportType === 'TAI_NAN_LAO_DONG'));
        return { name, code: String(id), ...getStatCols(getDetailStats(matches), '') };
      });

      // Prepare Table 1
      const LH_CODES = ['lh2', 'lh3', 'lh4', 'lh5', 'lh6', 'lh7', 'lh8', 'lh9', 'lh10']; // Maps to LoaiHinh ID 2-10
      let table1Data: any = {};
      for (let i = 2; i <= 10; i++) {
        const lhStats = rawReport.loaiHinhStats?.find((x: any) => x.loaiHinh?.id === i);
        const st = lhStats?.tnldSummary || {};
        const prefix = `lh${i}`;
        const totalEmp = Number(lhStats?.totalEmployees || 0);
        const tnldCount = Number(st.tongSoNguoiBiNan || 0);
        const ktnld = totalEmp > 0 ? ((tnldCount / totalEmp) * 1000).toFixed(2) : "0";
        const chetCount = Number(st.tongSoNguoiChet || 0);
        const kchet = totalEmp > 0 ? ((chetCount / totalEmp) * 100000).toFixed(2) : "0";

        table1Data[`${prefix}_c1`] = formatNumberWithDots(st.tongSoVu || "0"); // tong
        table1Data[`${prefix}_c2`] = formatNumberWithDots(lhStats?.reportCount || "0"); // co so
        table1Data[`${prefix}_c3`] = formatNumberWithDots(lhStats?.totalEmployees || "0");
        table1Data[`${prefix}_c4`] = formatNumberWithDots(lhStats?.reportCount || "0"); // LD cua co so bao cao
        table1Data[`${prefix}_c5`] = formatNumberWithDots(lhStats?.femaleEmployees || "0");
        table1Data[`${prefix}_c6`] = formatNumberWithDots(st.tongSoNguoiBiNan || "0");
        table1Data[`${prefix}_c7`] = formatNumberWithDots(st.tongSoNguoiChet || "0");
        table1Data[`${prefix}_c8`] = formatNumberWithDots(st.tongSoThuongNang || "0");
        table1Data[`${prefix}_c9`] = ktnld;
        table1Data[`${prefix}_c10`] = kchet;
        table1Data[`${prefix}_c11`] = ""; // ghi chu
      }

      const totalEmpAll = Number(rawReport.totalEmployees || 0);
      const tnldCountAll = Number(tnldSummary.tongSoNguoiBiNan || 0);
      const chetCountAll = Number(tnldSummary.tongSoNguoiChet || 0);
      const ktnldAll = totalEmpAll > 0 ? ((tnldCountAll / totalEmpAll) * 1000).toFixed(2) : "0";
      const kchetAll = totalEmpAll > 0 ? ((chetCountAll / totalEmpAll) * 100000).toFixed(2) : "0";


      // Prepare data
      const docData = {
        ...causesData,
        factors,
        occupations: occupationsExport,
        ...table1Data,
        ...getStatCols(tnldTroCapSummary, 't2_201'),
        ...getStatCols({
          tongSoVu: (Number(tnldSummary.tongSoVu || 0) + Number(tnldTroCapSummary.tongSoVu || 0)),
          tongSoVuNguoiChet: (Number(tnldSummary.tongSoVuNguoiChet || 0) + Number(tnldTroCapSummary.tongSoVuNguoiChet || 0)),
          tongSoVu2NguoiTroLen: (Number(tnldSummary.tongSoVu2NguoiTroLen || tnldSummary.tongSoVu2Nguoi || 0) + Number(tnldTroCapSummary.tongSoVu2NguoiTroLen || tnldTroCapSummary.tongSoVu2Nguoi || 0)),
          tongSoNguoiBiNan: (Number(tnldSummary.tongSoNguoiBiNan || 0) + Number(tnldTroCapSummary.tongSoNguoiBiNan || 0)),
          tongSoNuBiNan: (Number(tnldSummary.tongLaoDongNuBiNan || tnldSummary.tongSoNuBiNan || 0) + Number(tnldTroCapSummary.tongLaoDongNuBiNan || tnldTroCapSummary.tongSoNuBiNan || 0)),
          soNguoiChet: (Number(tnldSummary.tongSoNguoiChet || tnldSummary.soNguoiChet || 0) + Number(tnldTroCapSummary.tongSoNguoiChet || tnldTroCapSummary.soNguoiChet || 0)),
          soNguoiBiThuongNang: (Number(tnldSummary.tongSoThuongNang || tnldSummary.soNguoiBiThuongNang || 0) + Number(tnldTroCapSummary.tongSoThuongNang || tnldTroCapSummary.soNguoiBiThuongNang || 0)),
          tongNgayNghi: (Number(tnldSummary.tongNgayNghi || 0) + Number(tnldTroCapSummary.tongNgayNghi || 0)),
          chiPhiYTe: (Number(tnldSummary.chiPhiYTe || 0) + Number(tnldTroCapSummary.chiPhiYTe || 0)),
          chiPhiTraLuong: (Number(tnldSummary.chiPhiTraLuong || 0) + Number(tnldTroCapSummary.chiPhiTraLuong || 0)),
          chiPhiBoiThuong: (Number(tnldSummary.chiPhiBoiThuong || 0) + Number(tnldTroCapSummary.chiPhiBoiThuong || 0)),
          thietHaiTaiSan: (Number(tnldSummary.thietHaiTaiSan || 0) + Number(tnldTroCapSummary.thietHaiTaiSan || 0)),
        }, 't2_301'),
        companyName: "Sở Lao động - Thương binh và Xã hội",
        periodName: rawReport.period === 'CA_NAM' ? 'cả năm' : '6 tháng',
        reportYear: rawReport.year || "",
        reportDate: new Date().toLocaleDateString('vi-VN'),

        t1_c1: formatNumberWithDots(tnldSummary.tongSoVu || "0"),
        t1_c2: formatNumberWithDots(rawReport.reportCount || "0"),
        t1_c3: formatNumberWithDots(rawReport.totalEmployees || "0"),
        t1_c4: formatNumberWithDots(rawReport.reportCount || "0"),
        t1_c5: formatNumberWithDots(rawReport.femaleEmployees || "0"),
        t1_c6: formatNumberWithDots(tnldSummary.tongSoNguoiBiNan || "0"),
        t1_c7: formatNumberWithDots(tnldSummary.tongSoNguoiChet || "0"),
        t1_c8: formatNumberWithDots(tnldSummary.tongSoThuongNang || "0"),
        t1_c9: ktnldAll,
        t1_c10: kchetAll,

        ...getStatCols(tnldSummary, 't2')
      };

      doc.render(docData);
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
        const [response, factorsRes, lhRes, causesRes, occRes]: any = await Promise.all([
          periodicReportService.getSummary(queryParams),
          DoetService.getInjuryFactors(),
          (DoetService as any).getLoaiHinhKinhDoanh?.() || Promise.resolve({ data: [] }),
          DoetService.getAccidentCauses(),
          DoetService.getOccupations()
        ]);
        const report = response.data || response;
        setRawReport(report);
        const factors = factorsRes.data || factorsRes || [];
        setInjuryFactors(factors);
        const lHinhs = lhRes?.data?.items || lhRes?.data || lhRes || [];
        setLoaiHinhs(lHinhs);
        setLoaiHinhStats(report.loaiHinhStats || []);

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
          chetTong: summary?.soNguoiChet || 0,
          chetNgoai: summary?.khongQlNguoiChet || 0,
          thuongNangTong: summary?.soNguoiBiThuongNang || 0,
          thuongNangNgoai: summary?.khongQlNguoiBiThuongNang || 0,
          tongNgayNghi: summary?.tongNgayNghi || 0,
          chiPhiYTe: summary?.chiPhiYTe || 0,
          chiPhiTraLuong: summary?.chiPhiTraLuong || 0,
          chiPhiBoiThuong: summary?.chiPhiBoiThuong || 0,
          tongChiPhi: summary?.tongChiPhi || 0,
          thietHaiTaiSan: summary?.thietHaiTaiSan || 0,
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

        const groups = [
          {
            groupName: "Phân theo ngành nghề",
            items: [
              { id: '102', code: '102', name: 'Nhà lãnh đạo', data: mapData(getDetailByNgheNghiep(102)) },
              { id: '103', code: '103', name: 'Công nhân', data: mapData(getDetailByNgheNghiep(103)) },
            ]
          },
          {
            groupName: "Phân theo nguyên nhân",
            items: [
              { id: '1', code: '1', name: 'Do tổ chức điều kiện LĐ', data: mapData(getDetailByNguyenNhan(1)) },
              { id: '2', code: '2', name: 'Do thiếu sót các thiết bị, phương tiện BVCN', data: mapData(getDetailByNguyenNhan(2)) },
              { id: '3', code: '3', name: 'Không huấn luyện an toàn, VSLĐ', data: mapData(getDetailByNguyenNhan(3)) },
              { id: '4', code: '4', name: 'Vi phạm quy trình, nội quy, BP an toàn LĐ', data: mapData(getDetailByNguyenNhan(4)) },
              { id: '5', code: '5', name: 'Không sử dụng các thiết bị bảo vệ cá nhân', data: mapData(getDetailByNguyenNhan(5)) },
              { id: '6', code: '6', name: 'TN giao thông liên quan đến LĐ', data: mapData(getDetailByNguyenNhan(6)) },
              { id: '7', code: '7', name: 'Khách quan', data: mapData(getDetailByNguyenNhan(7)) },
              { id: '8', code: '8', name: 'Chữa cháy, cứu hộ', data: mapData(getDetailByNguyenNhan(8)) },
              { id: '9', code: '9', name: 'Khác (Ghi rõ)', data: mapData(getDetailByNguyenNhan(9)) },
            ]
          },
          {
            groupName: "Phân theo yếu tố gây chấn thương",
            items: factors.length > 0 ? factors.map((f: any) => ({
              id: 'chanthuong_' + f.id, code: String(f.id), name: f.name, data: mapData(getDetailByChanThuong(f.id))
            })) : [{ id: 'none', code: '', name: 'Không có dữ liệu', data: mapData({}) }]
          }
        ];

        setData(groups as any);
        setCosts(report.tnldSummary);
        setReportInfo({ year: report.year, period: report.period, totalReports: report.reportCount });
      } catch (error) {
        console.error("Lỗi tải báo cáo tổng hợp:", error);
      }
    };
    fetchData();
  }, [searchParams]);

  const renderDataValue = (value?: any) => {
    if (value === undefined || value === null || value === '') return '0';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('vi-VN');
  };

  const cellStyle = { border: '1px solid #e2e8f0', borderColor: '#e2e8f0' };
  const headStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#475569' };

  // Helper for Table 1
  const getLoaiHinhRow = (lh: any) => {
    const stats = loaiHinhStats.find(s => s.loaiHinh?.id === lh.id);
    const sum = stats?.tnldSummary || {};
    const totalEmp = Number(stats?.totalEmployees || 0);
    const tnldCount = Number(sum.tongSoNguoiBiNan || 0);
    const ktnld = totalEmp > 0 ? ((tnldCount / totalEmp) * 1000).toFixed(2) : "0";
    const chetCount = Number(sum.tongSoNguoiChet || 0);
    const kchet = totalEmp > 0 ? ((chetCount / totalEmp) * 100000).toFixed(2) : "0";

    return (
      <TableRow key={lh.id} hover>
        <TableCell sx={{ ...cellStyle }}>{lh.tenloaihinh || lh.name}</TableCell>
        <TableCell align="center" sx={cellStyle}>{lh.maloaihinh || lh.code || lh.id}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(sum.tongSoVu)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(stats?.reportCount)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(stats?.totalEmployees)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(stats?.reportCount)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(stats?.femaleEmployees)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(sum.tongSoNguoiBiNan)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(sum.tongSoNguoiChet)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{renderDataValue(sum.tongSoThuongNang)}</TableCell>
        <TableCell align="center" sx={cellStyle}>{ktnld}</TableCell>
        <TableCell align="center" sx={cellStyle}>{kchet}</TableCell>
        <TableCell sx={cellStyle}></TableCell>
      </TableRow>
    );
  };

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
            Báo cáo tổng hợp
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
              Hủy bỏ
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

            {/* PHẦN I: Thông tin tổng quan */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              I. Thông tin tổng quan:
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', overflowX: 'auto', mb: 4 }}>
              <Table stickyHeader aria-label="tong quan table" sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={3} align="center" sx={headStyle}>Loại hình cơ sở</TableCell>
                    <TableCell rowSpan={3} align="center" sx={{ ...headStyle, width: 80 }}>Mã số</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Cơ sở</TableCell>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Lực lượng lao động</TableCell>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Tổng số tai nạn lao động</TableCell>
                    <TableCell colSpan={2} align="center" sx={headStyle}>Tần suất tai nạn lao động</TableCell>
                    <TableCell rowSpan={3} align="center" sx={headStyle}>Ghi chú</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Số cơ sở tham gia</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Tổng số lao động</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Số LĐ của cơ sở tham gia báo cáo</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Số lao động nữ</TableCell>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Số người bị TNLĐ</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>KTNLĐ</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>KChết</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>Số người chết</TableCell>
                    <TableCell align="center" sx={headStyle}>Số người bị thương nặng</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }}>Tổng số</TableCell>
                    <TableCell align="center" sx={cellStyle}></TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoVu)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(reportInfo?.totalReports)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.totalEmployees)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(reportInfo?.totalReports)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.femaleEmployees)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoNguoiBiNan)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoNguoiChet)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoThuongNang)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>
                      {rawReport?.totalEmployees > 0 ? ((Number(rawReport?.tnldSummary?.tongSoNguoiBiNan || 0) / Number(rawReport?.totalEmployees)) * 1000).toFixed(2) : "0"}
                    </TableCell>
                    <TableCell align="center" sx={cellStyle}>
                      {rawReport?.totalEmployees > 0 ? ((Number(rawReport?.tnldSummary?.tongSoNguoiChet || 0) / Number(rawReport?.totalEmployees)) * 100000).toFixed(2) : "0"}
                    </TableCell>
                    <TableCell sx={cellStyle}></TableCell>
                  </TableRow>
                  {loaiHinhs.map((lh: any) => getLoaiHinhRow(lh))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PHẦN II: Phân loại TNLĐ */}
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              II. Phân loại TNLĐ:
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <Table stickyHeader aria-label="phan loai tnld" sx={{ minWidth: 1200 }}>

                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={3} align="center" sx={{ ...headStyle, width: 250 }}>Tên chỉ tiêu thống kê</TableCell>
                    <TableCell rowSpan={3} align="center" sx={{ ...headStyle, width: 60 }}>Mã số</TableCell>
                    <TableCell colSpan={7} align="center" sx={headStyle}>Phân loại TNLĐ theo mức độ thương tật</TableCell>
                    <TableCell colSpan={6} align="center" sx={headStyle}>Thiệt hại do TNLĐ</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Số vụ TNLĐ</TableCell>
                    <TableCell colSpan={4} align="center" sx={headStyle}>Số người bị nạn (Người)</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Tổng số ngày nghỉ vì TNLĐ</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Tổng số tiền</TableCell>
                    <TableCell colSpan={3} align="center" sx={headStyle}>Chi tiết</TableCell>
                    <TableCell rowSpan={2} align="center" sx={headStyle}>Thiệt hại tài sản (1.000 đ)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>Số vụ có người chết</TableCell>
                    <TableCell align="center" sx={headStyle}>Số vụ có từ 2 người bị nạn trở lên</TableCell>

                    <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                    <TableCell align="center" sx={headStyle}>Số LĐ nữ</TableCell>
                    <TableCell align="center" sx={headStyle}>Số người bị chết</TableCell>
                    <TableCell align="center" sx={headStyle}>Số người bị thương nặng</TableCell>

                    <TableCell align="center" sx={headStyle}>Y Tế</TableCell>
                    <TableCell align="center" sx={headStyle}>Trả lương theo thời gian điều trị</TableCell>
                    <TableCell align="center" sx={headStyle}>Bồi thường/ Trợ cấp</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  <TableRow hover sx={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                    <TableCell sx={{ ...cellStyle, fontWeight: 'bold' }} colSpan={2}>Tổng số</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoVu)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoVuNguoiChet)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoVu2NguoiTroLen || rawReport?.tnldSummary?.tongSoVu2Nguoi)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoNguoiBiNan)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongLaoDongNuBiNan || rawReport?.tnldSummary?.tongSoNuBiNan)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoNguoiChet || rawReport?.tnldSummary?.soNguoiChet)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(rawReport?.tnldSummary?.tongSoThuongNang || rawReport?.tnldSummary?.soNguoiBiThuongNang)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.tongNgayNghi)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.tongChiPhi || (Number(costs?.chiPhiYTe || 0) + Number(costs?.chiPhiTraLuong || 0) + Number(costs?.chiPhiBoiThuong || 0)))}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.chiPhiYTe)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.chiPhiTraLuong)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.chiPhiBoiThuong)}</TableCell>
                    <TableCell align="center" sx={cellStyle}>{renderDataValue(costs?.thietHaiTaiSan)}</TableCell>
                  </TableRow>
                  {data.map((group: any, groupIndex: number) => (
                    <React.Fragment key={groupIndex}>
                      {group.items.map((row: any, itemIndex: number) => (
                        <TableRow key={row.id} hover>
                          {itemIndex === 0 && (
                            <TableCell rowSpan={group.items.length} sx={{ ...cellStyle, fontWeight: 'bold', verticalAlign: 'top' }}>
                              {group.groupName}
                            </TableCell>
                          )}
                          <TableCell align="center" sx={cellStyle}>{row.code}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongSoVu)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.soVuChet)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.soVuTren2)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongNguoi)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.nguoiNu)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chetTong)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.thuongNangTong)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongNgayNghi)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.tongChiPhi || (Number(row.data?.chiPhiYTe || 0) + Number(row.data?.chiPhiTraLuong || 0) + Number(row.data?.chiPhiBoiThuong || 0)))}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chiPhiYTe)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chiPhiTraLuong)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.chiPhiBoiThuong)}</TableCell>
                          <TableCell align="center" sx={cellStyle}>{renderDataValue(row.data?.thietHaiTaiSan)}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>

              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
  );
}
