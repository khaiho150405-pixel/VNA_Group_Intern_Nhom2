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
import PrintIcon from '@mui/icons-material/Print';
import { useReactToPrint } from 'react-to-print';
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
import { periodicReportService } from '@tts/services';

export function AccidentReportSummaryPage() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [costs, setCosts] = useState<any>(null);
  const [reportInfo, setReportInfo] = useState<{ year?: number, period?: string, totalReports?: number } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = React.useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bao_cao_tai_nan_lao_dong_${reportInfo?.period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${reportInfo?.year || 2023}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const response: any = await periodicReportService.getSummary(queryParams);
        const report = response.data || response;

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
