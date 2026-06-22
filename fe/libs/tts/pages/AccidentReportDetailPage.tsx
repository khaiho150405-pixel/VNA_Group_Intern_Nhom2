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
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@core/layouts/MainLayout';

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
import { periodicReportService } from '@tts/services';

export function AccidentReportDetailPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [reportInfo, setReportInfo] = useState<{ year?: number, period?: string, fileUrl?: string } | null>(null);
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const printRef = React.useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bao_cao_tai_nan_lao_dong_${reportInfo?.period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${reportInfo?.year || 2023}`,
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const response: any = await periodicReportService.getById(id);
        const report = response.data || response;

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

        const getDetailByNguyenNhan = (id: number) => {
          const detail = report.accidentDetails?.find((d: any) => d.nguyenNhanId === id && d.reportType === 'TAI_NAN_LAO_DONG');
          return detail ? mapData(detail.stats) : mapData({});
        };

        const tnld = mapData(report.tnldSummary);
        const troCap = mapData(report.tnldTroCapSummary);

        const rows: ReportRow[] = [
          { id: "1", code: "", name: "1. Tai nạn lao động", isHeader: true, level: 0 },
          { id: "1-0", code: "", name: "Tai nạn lao động", isHeader: false, level: 0, data: tnld },

          { id: "1.1", code: "", name: "1.1 Phân theo nguyên nhân xảy ra TNLĐ", isHeader: true, level: 0 },
          { id: "1.1-a", code: "", name: "a. Do người sử dụng lao động", isHeader: true, level: 0 },
          { id: "1.1-a-1", code: "1", name: "Không có thiết bị an toàn hoặc thiết bị không đảm bảo an toàn", isHeader: false, level: 0, data: getDetailByNguyenNhan(1) },
          { id: "1.1-a-2", code: "2", name: "Không có phương tiện bảo vệ cá nhân hoặc phương tiện bảo vệ cá nhân không tốt", isHeader: false, level: 0, data: getDetailByNguyenNhan(2) },
          { id: "1.1-a-3", code: "3", name: "Tổ chức lao động không hợp lý", isHeader: false, level: 0, data: getDetailByNguyenNhan(3) },
          { id: "1.1-a-4", code: "4", name: "Chưa huấn luyện hoặc huấn luyện an toàn vệ sinh lao động chưa đầy đủ", isHeader: false, level: 0, data: getDetailByNguyenNhan(4) },
          { id: "1.1-a-5", code: "5", name: "Không có quy trình an toàn hoặc biện pháp làm việc an toàn", isHeader: false, level: 0, data: getDetailByNguyenNhan(5) },
          { id: "1.1-a-6", code: "6", name: "Điều kiện làm việc không tốt", isHeader: false, level: 0, data: getDetailByNguyenNhan(6) },

          { id: "1.1-b", code: "", name: "b. Do người lao động", isHeader: true, level: 0 },
          { id: "1.1-b-7", code: "7", name: "Quy phạm nội quy, quy trình, quy chuẩn, biện pháp làm việc an toàn", isHeader: false, level: 0, data: getDetailByNguyenNhan(7) },
          { id: "1.1-b-8", code: "8", name: "Không sử dụng phương tiện bảo vệ cá nhân", isHeader: false, level: 0, data: getDetailByNguyenNhan(8) },

          { id: "1.1-9", code: "9", name: "Khách quan khó tránh/ Nguyên nhân chưa kể đến", isHeader: false, level: 0, data: getDetailByNguyenNhan(9) },

          { id: "1.2", code: "", name: "1.2. Phân theo yếu tố gây chấn thương", isHeader: true, level: 0 },
        ];

        const yeuToDetails = report.accidentDetails?.filter((d: any) => d.yeuToChanThuongId && d.reportType === 'TAI_NAN_LAO_DONG') || [];
        if (yeuToDetails.length === 0) {
          rows.push({ id: "1.2-empty", code: "101", name: "Thiết bị nâng", isHeader: false, level: 0, data: mapData({}) });
        } else {
          yeuToDetails.forEach((d: any) => {
            let name = "Yếu tố " + d.yeuToChanThuongId;
            if (d.yeuToChanThuongId === 101) name = "Thiết bị nâng";
            rows.push({ id: `1.2-${d.yeuToChanThuongId}`, code: `${d.yeuToChanThuongId}`, name, isHeader: false, level: 0, data: mapData(d.stats) });
          });
        }

        rows.push({ id: "1.3", code: "", name: "1.3 Phân theo nghề nghiệp", isHeader: true, level: 0 });
        const ngheNghiepDetails = report.accidentDetails?.filter((d: any) => d.ngheNghiepId && d.reportType === 'TAI_NAN_LAO_DONG') || [];
        if (ngheNghiepDetails.length === 0) {
          rows.push({ id: "1.3-empty1", code: "102", name: "Nhà lãnh đạo cơ quan Đảng Cộng sản Việt nam cấp Trung ương", isHeader: false, level: 0, data: mapData({}) });
          rows.push({ id: "1.3-empty2", code: "103", name: "Công nhân", isHeader: false, level: 0, data: mapData({}) });
        } else {
          ngheNghiepDetails.forEach((d: any) => {
            let name = "Nghề nghiệp " + d.ngheNghiepId;
            if (d.ngheNghiepId === 102) name = "Nhà lãnh đạo cơ quan Đảng Cộng sản Việt nam cấp Trung ương";
            if (d.ngheNghiepId === 103) name = "Công nhân";
            rows.push({ id: `1.3-${d.ngheNghiepId}`, code: `${d.ngheNghiepId}`, name, isHeader: false, level: 0, data: mapData(d.stats) });
          });
        }

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
        setReportInfo({ year: report.year, period: report.period, fileUrl: report.reportFileUrl });
      } catch (error) {
        console.error("Lỗi tải chi tiết báo cáo:", error);
      }
    };

    fetchData();
  }, [id]);

  const renderDataValue = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toString();
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
            Báo cáo định kỳ Tai nạn lao động
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
              startIcon={<PrintIcon />}
              sx={{ color: '#3b82f6', borderColor: '#3b82f6' }}
              onClick={() => handlePrint()}
            >
              In báo cáo
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box
            ref={printRef}
            sx={{
              backgroundColor: '#fff',
              p: 3,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              '@media print': {
                border: 'none',
                m: 0,
                p: 0,
              }
            }}
          >
            <style type="text/css" media="print">
              {`@page { size: portrait; margin: 10mm; }`}
            </style>

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
                  href={reportInfo.fileUrl.startsWith('http') ? reportInfo.fileUrl : `/${reportInfo.fileUrl}`}
                  target="_blank"
                  underline="always"
                  sx={{ color: '#3b82f6' }}
                >
                  {reportInfo.fileUrl.split('/').pop()}
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
    </MainLayout>
  );
}
