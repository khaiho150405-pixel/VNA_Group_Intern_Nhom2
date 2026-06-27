"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, TextField,
  Select, MenuItem, CircularProgress, Grid, Paper, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Link as MuiLink, Accordion, AccordionSummary, AccordionDetails,
  FormControl, InputLabel, Autocomplete, Tooltip, Alert
} from '@mui/material';

const RequiredLabel = ({ text, required = true }: { text: string; required?: boolean }) => (
  <span>{text} {required && <span style={{ color: '#ef4444' }}>*</span>}</span>
);
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Save as SaveIcon,
  FileDownload as FileDownloadIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useReactToPrint } from 'react-to-print';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { useAccidentReportStyles } from '../logic/accident-report/style';
import { DoetService, periodicReportService, reportPeriodService } from '@tts/services';

const CAUSES = [
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

const OCCUPATIONS = [
  { id: 102, name: "Nhà lãnh đạo cơ quan Đảng Cộng sản Việt nam cấp Trung ương" },
  { id: 103, name: "Công nhân" }
];

// Helper formatting functions
const formatNumberWithDots = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '0';
  const raw = String(val).replace(/\./g, '');
  if (isNaN(Number(raw))) return '0';
  return Number(raw).toLocaleString('vi-VN');
};

const parseFormattedNumber = (val: string) => {
  return Number(String(val).replace(/\./g, '')) || 0;
};

// Initial summary stats structure
const createDefaultStats = () => ({
  tongSoVu: '0',
  tongSoVuNguoiChet: '0',
  tongSoVu2Nguoi: '0',
  tongSoNguoiBiNan: '0',
  tongLaoDongNuBiNan: '0',
  tongSoNuBiNan: '0',
  tongSoNguoiChet: '0',
  tongSoThuongNang: '0',
  khongQlNguoiBiNan: '0',
  khongQlNuBiNan: '0',
  khongQlNguoiChet: '0',
  khongQlThuongNang: '0',
  chiPhiYTe: '0',
  chiPhiTraLuong: '0',
  chiPhiBoiThuong: '0',
  tongChiPhi: '0',
  tongNgayNghi: '0',
  thietHaiTaiSan: '0'
});

const convertStatsToStrings = (stats: any) => {
  const defaultStats = createDefaultStats();
  if (!stats) return defaultStats;
  const result: any = {};
  Object.keys(defaultStats).forEach(key => {
    const val = stats[key];
    result[key] = val !== undefined && val !== null && val !== '' ? String(val) : '0';
  });
  return result;
};

const isIntegerNonNegative = (val: any, allowDots: boolean = false): boolean => {
  if (val === undefined || val === null || val === '') return false;
  const str = String(val);
  if (allowDots) {
    return /^\d+(\.\d+)*$/.test(str) || /^\d+$/.test(str.replace(/\./g, ''));
  }
  return /^\d+$/.test(str);
};

const getAbsoluteFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3800/api/v1').replace('/api/v1', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const aggregateStats = (list: any[]) => {
  const sum = {
    tongSoVu: 0,
    tongSoVuNguoiChet: 0,
    tongSoVu2Nguoi: 0,
    tongSoNguoiBiNan: 0,
    tongLaoDongNuBiNan: 0,
    tongSoNuBiNan: 0,
    tongSoNguoiChet: 0,
    tongSoThuongNang: 0,
    khongQlNguoiBiNan: 0,
    khongQlNuBiNan: 0,
    khongQlNguoiChet: 0,
    khongQlThuongNang: 0,
    chiPhiYTe: 0,
    chiPhiTraLuong: 0,
    chiPhiBoiThuong: 0,
    tongChiPhi: 0,
    tongNgayNghi: 0,
    thietHaiTaiSan: 0
  };
  list.forEach(item => {
    const s = item.stats || {};
    sum.tongSoVu += Number(s.tongSoVu || 0);
    sum.tongSoVuNguoiChet += Number(s.tongSoVuNguoiChet || 0);
    sum.tongSoVu2Nguoi += Number(s.tongSoVu2Nguoi || s.tongSoVu2NguoiTroLen || 0);
    sum.tongSoNguoiBiNan += Number(s.tongSoNguoiBiNan || 0);
    sum.tongLaoDongNuBiNan += Number(s.tongLaoDongNuBiNan ?? s.tongSoNuBiNan ?? 0);
    sum.tongSoNuBiNan += Number(s.tongLaoDongNuBiNan ?? s.tongSoNuBiNan ?? 0);
    sum.khongQlNguoiBiNan += Number(s.khongQlNguoiBiNan || 0);
    sum.khongQlNuBiNan += Number(s.khongQlNuBiNan || 0);
    sum.tongSoNguoiChet += Number(s.tongSoNguoiChet || 0);
    sum.khongQlNguoiChet += Number(s.khongQlNguoiChet || 0);
    sum.tongSoThuongNang += Number(s.tongSoThuongNang || s.tongSoNguoiThuongNang || 0);
    sum.khongQlThuongNang += Number(s.khongQlThuongNang || 0);
  });

  const result: any = {};
  Object.keys(sum).forEach(key => {
    result[key] = String(sum[key as keyof typeof sum]);
  });
  return result;
};

export const EnterpriseAccidentReportPage = ({ user }: { user: any }) => {
  const classes = useAccidentReportStyles();
  const { enqueueSnackbar } = useSnackbar();

  // State definitions
  const [mode, setMode] = useState<'list' | 'edit' | 'view'>('list');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);

  // List data states
  const [existingReports, setExistingReports] = useState<any[]>([]);
  const [activePeriods, setActivePeriods] = useState<any[]>([]);
  const [myCompany, setMyCompany] = useState<any>(null);

  // Edit/wizard states
  const [step, setStep] = useState<number>(0); // 0: Company Info, 1: TNLĐ, 2: Trợ cấp, 3: Review/Upload
  const [tabIndex, setTabIndex] = useState<number>(0); // Step 1 tabs (0: Tổng hợp, 1: Chi tiết)
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState<boolean>(false);

  // Active form data
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'6_THANG' | 'CA_NAM'>('6_THANG');
  const [totalEmployees, setTotalEmployees] = useState<string>('');
  const [femaleEmployees, setFemaleEmployees] = useState<string>('');
  const [totalSalaryFund, setTotalSalaryFund] = useState<string>('');
  const [tnldSummary, setTnldSummary] = useState<any>(createDefaultStats());
  const [tnldTroCapSummary, setTnldTroCapSummary] = useState<any>(createDefaultStats());
  const [accidentDetails, setAccidentDetails] = useState<any[]>([]);
  const [reportFileUrl, setReportFileUrl] = useState<string>('');
  const [reportFileName, setReportFileName] = useState<string>('');
  const [currentRejectReason, setCurrentRejectReason] = useState<string>('');
  const [rejectReasonDialogOpen, setRejectReasonDialogOpen] = useState<boolean>(false);

  // Dropdown options loaded from DB
  const [injuryFactors, setInjuryFactors] = useState<any[]>([]);

  const validateFieldDirect = (fieldKey: string, value: any, currentErrors: Record<string, string>): boolean => {
    let errMsg = '';

    if (fieldKey === 'totalEmployees') {
      if (value === undefined || value === null || value === '') {
        errMsg = "Trường này không được để trống";
      } else if (!isIntegerNonNegative(value)) {
        errMsg = "Tổng số lao động phải là số nguyên dương hoặc bằng 0";
      }
    } else if (fieldKey === 'femaleEmployees') {
      if (value === undefined || value === null || value === '') {
        errMsg = "Trường này không được để trống";
      } else if (!isIntegerNonNegative(value)) {
        errMsg = "Tổng số lao động nữ phải là số nguyên không âm";
      } else {
        const val = parseInt(value);
        if (totalEmployees && val > (parseInt(totalEmployees) || 0)) {
          errMsg = "Số lao động nữ không được vượt quá Tổng số lao động";
        }
      }
    } else if (fieldKey === 'totalSalaryFund') {
      if (value === undefined || value === null || value === '') {
        errMsg = "Trường này không được để trống";
      } else if (!isIntegerNonNegative(value, true)) {
        errMsg = "Tổng quỹ lương phải là số nguyên dương";
      } else {
        const val = parseFormattedNumber(value);
        if (val <= 0) {
          errMsg = "Tổng quỹ lương phải lớn hơn 0";
        }
      }
    } else if (fieldKey.startsWith('tnldSummary_') || fieldKey.startsWith('tnldTroCapSummary_')) {
      const isTroCap = fieldKey.startsWith('tnldTroCapSummary_');
      const field = fieldKey.split('_')[1];
      const stats = isTroCap ? tnldTroCapSummary : tnldSummary;
      const isMoneyField = ['chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'thietHaiTaiSan'].includes(field);

      if (value === undefined || value === null || value === '') {
        errMsg = "Trường này không được để trống";
      } else if (!isIntegerNonNegative(value, isMoneyField)) {
        errMsg = "Giá trị phải là số nguyên dương hoặc bằng 0";
      }

      if (!errMsg) {
        const tempStats = { ...stats, [field]: value };

        const tongSoVu = parseInt(tempStats.tongSoVu || 0);
        const tongSoVuNguoiChet = parseInt(tempStats.tongSoVuNguoiChet || 0);
        const tongSoVu2Nguoi = parseInt(tempStats.tongSoVu2Nguoi || 0);
        const tongSoNguoiBiNan = parseInt(tempStats.tongSoNguoiBiNan || 0);
        const tongLaoDongNuBiNan = parseInt(tempStats.tongLaoDongNuBiNan || 0);
        const tongSoNguoiChet = parseInt(tempStats.tongSoNguoiChet || 0);
        const tongSoThuongNang = parseInt(tempStats.tongSoThuongNang || 0);
        const khongQlNguoiBiNan = parseInt(tempStats.khongQlNguoiBiNan || 0);
        const khongQlNuBiNan = parseInt(tempStats.khongQlNuBiNan || 0);
        const khongQlNguoiChet = parseInt(tempStats.khongQlNguoiChet || 0);
        const khongQlThuongNang = parseInt(tempStats.khongQlThuongNang || 0);
        const chiPhiYTe = parseFormattedNumber(tempStats.chiPhiYTe || 0);
        const chiPhiTraLuong = parseFormattedNumber(tempStats.chiPhiTraLuong || 0);
        const chiPhiBoiThuong = parseFormattedNumber(tempStats.chiPhiBoiThuong || 0);
        const tongChiPhi = parseFormattedNumber(tempStats.tongChiPhi || 0);

        // 2. Ràng buộc cấp độ "Vụ" (Accidents)
        if (field === 'tongSoVuNguoiChet' && tongSoVuNguoiChet > tongSoVu) {
          errMsg = "Số vụ có người chết không được lớn hơn Tổng số vụ";
        } else if (field === 'tongSoVu2Nguoi' && tongSoVu2Nguoi > tongSoVu) {
          errMsg = "Số vụ có 2 người bị nạn trở lên không được lớn hơn Tổng số vụ";
        }
        
        // 3. Ràng buộc cấp độ "Người bị nạn" (Victims)
        else if (field === 'tongLaoDongNuBiNan' && tongLaoDongNuBiNan > tongSoNguoiBiNan) {
          errMsg = "Lao động nữ bị nạn không được lớn hơn Tổng số người bị nạn";
        } else if (field === 'tongSoNguoiChet' && tongSoNguoiChet > tongSoNguoiBiNan) {
          errMsg = "Tổng số người chết không được lớn hơn Tổng số người bị nạn";
        } else if (field === 'tongSoThuongNang' && tongSoThuongNang > tongSoNguoiBiNan) {
          errMsg = "Tổng số người bị thương nặng không được lớn hơn Tổng số người bị nạn";
        } else if (['tongSoNguoiChet', 'tongSoThuongNang', 'tongSoNguoiBiNan'].includes(field) && tongSoNguoiChet + tongSoThuongNang > tongSoNguoiBiNan) {
          errMsg = "Tổng số người chết và thương nặng không được vượt quá Tổng số người bị nạn";
        }
        
        // Ràng buộc không quản lý (khongQl...)
        else if (field === 'khongQlNuBiNan' && khongQlNuBiNan > khongQlNguoiBiNan) {
          errMsg = "Lao động nữ bị nạn không QL không được lớn hơn Số người bị nạn không QL";
        } else if (field === 'khongQlNguoiChet' && khongQlNguoiChet > khongQlNguoiBiNan) {
          errMsg = "Số người chết không QL không được lớn hơn Số người bị nạn không QL";
        } else if (field === 'khongQlThuongNang' && khongQlThuongNang > khongQlNguoiBiNan) {
          errMsg = "Người bị thương nặng không QL không được lớn hơn Số người bị nạn không QL";
        } else if (['khongQlNguoiChet', 'khongQlThuongNang', 'khongQlNguoiBiNan'].includes(field) && khongQlNguoiChet + khongQlThuongNang > khongQlNguoiBiNan) {
          errMsg = "Tổng số người chết và thương nặng không QL không được vượt quá Số người bị nạn không QL";
        }
        
        // Chi phí
        else if (['chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi'].includes(field)) {
          const sum = chiPhiYTe + chiPhiTraLuong + chiPhiBoiThuong;
          if (tongChiPhi !== sum) {
            errMsg = "Tổng chi phí phải bằng Y tế + Lương + Bồi thường";
          }
        }

        // 4. Ràng buộc chéo giữa "Vụ" và "Người" cho Tổng hợp (Cross validations)
        if (!errMsg) {
          // A. Tổng số vụ có người chết vs Số người chết
          if (['tongSoVuNguoiChet', 'tongSoNguoiChet'].includes(field)) {
            let fatalErr = '';
            if (tongSoVuNguoiChet === 0 && tongSoNguoiChet > 0) {
              fatalErr = "Số người chết phải bằng 0 khi số vụ có người chết bằng 0";
            } else if (tongSoVuNguoiChet > 0 && tongSoNguoiChet < tongSoVuNguoiChet) {
              fatalErr = "Số người chết phải lớn hơn hoặc bằng số vụ có người chết";
            }
            currentErrors[`${isTroCap ? 'tnldTroCapSummary_' : 'tnldSummary_'}tongSoVuNguoiChet`] = fatalErr;
            currentErrors[`${isTroCap ? 'tnldTroCapSummary_' : 'tnldSummary_'}tongSoNguoiChet`] = fatalErr;
            if (fatalErr) errMsg = fatalErr;
          }

          // B. Tổng số vụ vs Tổng số người bị nạn vs Số vụ có từ 2 người bị nạn trở lên (Cross validation)
          if (['tongSoVu', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan'].includes(field)) {
            let victimErr = '';
            if (tongSoVu === 0 && tongSoNguoiBiNan > 0) {
              victimErr = "Tổng số người bị nạn phải bằng 0 khi tổng số vụ bằng 0";
            } else if (tongSoVu > 0 && tongSoNguoiBiNan < (tongSoVu + tongSoVu2Nguoi)) {
              victimErr = `Tổng số người bị nạn phải lớn hơn hoặc bằng Tổng số vụ + Số vụ có 2 người bị nạn trở lên (${tongSoVu + tongSoVu2Nguoi})`;
            } else if (tongSoVu2Nguoi === 0 && tongSoVu > 0 && tongSoNguoiBiNan !== tongSoVu) {
              victimErr = `Khi không có vụ nào có từ 2 người bị nạn trở lên, tổng số người bị nạn phải bằng tổng số vụ (${tongSoVu})`;
            }
            
            currentErrors[`${isTroCap ? 'tnldTroCapSummary_' : 'tnldSummary_'}tongSoVu`] = victimErr;
            currentErrors[`${isTroCap ? 'tnldTroCapSummary_' : 'tnldSummary_'}tongSoVu2Nguoi`] = victimErr;
            currentErrors[`${isTroCap ? 'tnldTroCapSummary_' : 'tnldSummary_'}tongSoNguoiBiNan`] = victimErr;
            if (victimErr) errMsg = victimErr;
          }
        }
      }
    } else if (fieldKey.startsWith('accidentDetails_')) {
      const parts = fieldKey.split('_');
      const idx = parseInt(parts[1]);
      const field = parts[2];
      const detail = accidentDetails[idx];

      if (field === 'nguyenNhanId' || field === 'yeuToChanThuongId' || field === 'ngheNghiepId') {
        if (!value) {
          errMsg = "Trường này không được để trống";
        }
      } else if (detail && detail.stats) {
        const isMoneyField = ['chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'thietHaiTaiSan'].includes(field);

        if (value === undefined || value === null || value === '') {
          errMsg = "Trường này không được để trống";
        } else if (!isIntegerNonNegative(value, isMoneyField)) {
          errMsg = "Giá trị phải là số nguyên dương hoặc bằng 0";
        }

        if (!errMsg) {
          const tempStats = { ...detail.stats, [field]: value };
          tempStats.tongSoVu = '1';
          const numDead = parseInt(tempStats.tongSoNguoiChet || '0') || 0;
          tempStats.tongSoVuNguoiChet = numDead > 0 ? '1' : '0';
          const numVictims = parseInt(tempStats.tongSoNguoiBiNan || '0') || 0;
          tempStats.tongSoVu2Nguoi = numVictims >= 2 ? '1' : '0';

          const tongSoVu = parseInt(tempStats.tongSoVu || 0);
          const tongSoVuNguoiChet = parseInt(tempStats.tongSoVuNguoiChet || 0);
          const tongSoVu2Nguoi = parseInt(tempStats.tongSoVu2Nguoi || 0);
          const tongSoNguoiBiNan = parseInt(tempStats.tongSoNguoiBiNan || 0);
          const tongLaoDongNuBiNan = parseInt(tempStats.tongLaoDongNuBiNan || 0);
          const tongSoNguoiChet = parseInt(tempStats.tongSoNguoiChet || 0);
          const tongSoThuongNang = parseInt(tempStats.tongSoThuongNang || 0);
          const khongQlNguoiBiNan = parseInt(tempStats.khongQlNguoiBiNan || 0);
          const khongQlNuBiNan = parseInt(tempStats.khongQlNuBiNan || 0);
          const khongQlNguoiChet = parseInt(tempStats.khongQlNguoiChet || 0);
          const khongQlThuongNang = parseInt(tempStats.khongQlThuongNang || 0);
          const chiPhiYTe = parseFormattedNumber(tempStats.chiPhiYTe || 0);
          const chiPhiTraLuong = parseFormattedNumber(tempStats.chiPhiTraLuong || 0);
          const chiPhiBoiThuong = parseFormattedNumber(tempStats.chiPhiBoiThuong || 0);
          const tongChiPhi = parseFormattedNumber(tempStats.tongChiPhi || 0);

          // 2. Ràng buộc cấp độ "Vụ" (Accidents)
          if (field === 'tongSoVuNguoiChet' && tongSoVuNguoiChet > tongSoVu) {
            errMsg = "Số vụ có người chết không được lớn hơn Số vụ";
          } else if (field === 'tongSoVu2Nguoi' && tongSoVu2Nguoi > tongSoVu) {
            errMsg = "Số vụ có 2 người bị nạn trở lên không được lớn hơn Số vụ";
          }
          
          // 3. Ràng buộc cấp độ "Người bị nạn" (Victims)
          else if (field === 'tongLaoDongNuBiNan' && tongLaoDongNuBiNan > tongSoNguoiBiNan) {
            errMsg = "Lao động nữ bị nạn không được lớn hơn Số người bị nạn";
          } else if (field === 'tongSoNguoiChet' && tongSoNguoiChet > tongSoNguoiBiNan) {
            errMsg = "Tổng số người chết không được lớn hơn Số người bị nạn";
          } else if (field === 'tongSoThuongNang' && tongSoThuongNang > tongSoNguoiBiNan) {
            errMsg = "Tổng số người bị thương nặng không được lớn hơn Số người bị nạn";
          } else if (['tongSoNguoiChet', 'tongSoThuongNang', 'tongSoNguoiBiNan'].includes(field) && tongSoNguoiChet + tongSoThuongNang > tongSoNguoiBiNan) {
            errMsg = "Tổng số người chết và thương nặng không được vượt quá Số người bị nạn";
          }
          
          // Ràng buộc không quản lý (khongQl...)
          else if (field === 'khongQlNuBiNan' && khongQlNuBiNan > khongQlNguoiBiNan) {
            errMsg = "Lao động nữ bị nạn không QL không được lớn hơn Số người bị nạn không QL";
          } else if (field === 'khongQlNguoiChet' && khongQlNguoiChet > khongQlNguoiBiNan) {
            errMsg = "Số người chết không QL không được lớn hơn Số người bị nạn không QL";
          } else if (field === 'khongQlThuongNang' && khongQlThuongNang > khongQlNguoiBiNan) {
            errMsg = "Người bị thương nặng không QL không được lớn hơn Số người bị nạn không QL";
          } else if (['khongQlNguoiChet', 'khongQlThuongNang', 'khongQlNguoiBiNan'].includes(field) && khongQlNguoiChet + khongQlThuongNang > khongQlNguoiBiNan) {
            errMsg = "Tổng số người chết và thương nặng không QL không được vượt quá Số người bị nạn không QL";
          }
          
          // Chi phí
          else if (['chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi'].includes(field)) {
            const sum = chiPhiYTe + chiPhiTraLuong + chiPhiBoiThuong;
            if (tongChiPhi !== sum) {
              errMsg = "Tổng chi phí phải bằng Y tế + Lương + Bồi thường";
            }
          }

          // Ràng buộc chéo cho chi tiết vụ
          if (!errMsg) {
            // A. Tổng số vụ có người chết vs Số người chết
            if (['tongSoVuNguoiChet', 'tongSoNguoiChet'].includes(field)) {
              let fatalErr = '';
              if (tongSoVuNguoiChet === 0 && tongSoNguoiChet > 0) {
                fatalErr = "Số người chết phải bằng 0 khi số vụ có người chết bằng 0";
              } else if (tongSoVuNguoiChet > 0 && tongSoNguoiChet < tongSoVuNguoiChet) {
                fatalErr = "Số người chết phải lớn hơn hoặc bằng số vụ có người chết";
              }
              currentErrors[`accidentDetails_${idx}_tongSoVuNguoiChet`] = fatalErr;
              currentErrors[`accidentDetails_${idx}_tongSoNguoiChet`] = fatalErr;
              if (fatalErr) errMsg = fatalErr;
            }

            // B. Tổng số vụ vs Tổng số người bị nạn vs Số vụ có từ 2 người bị nạn trở lên (Cross validation)
            if (['tongSoVu', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan'].includes(field)) {
              let victimErr = '';
              if (tongSoVu === 0 && tongSoNguoiBiNan > 0) {
                victimErr = "Tổng số người bị nạn phải bằng 0 khi số vụ bằng 0";
              } else if (tongSoVu > 0 && tongSoNguoiBiNan < (tongSoVu + tongSoVu2Nguoi)) {
                victimErr = `Tổng số người bị nạn phải lớn hơn hoặc bằng Số vụ + Số vụ có 2 người bị nạn trở lên (${tongSoVu + tongSoVu2Nguoi})`;
              } else if (tongSoVu2Nguoi === 0 && tongSoVu > 0 && tongSoNguoiBiNan !== tongSoVu) {
                victimErr = `Khi không có vụ nào có từ 2 người bị nạn trở lên, tổng số người bị nạn phải bằng số vụ (${tongSoVu})`;
              }
              currentErrors[`accidentDetails_${idx}_tongSoVu`] = victimErr;
              currentErrors[`accidentDetails_${idx}_tongSoVu2Nguoi`] = victimErr;
              currentErrors[`accidentDetails_${idx}_tongSoNguoiBiNan`] = victimErr;
              if (victimErr) errMsg = victimErr;
            }
          }
        }
      }
    }

    currentErrors[fieldKey] = errMsg;
    return !errMsg;
  };

  const validateField = (fieldKey: string, value: any) => {
    if (!hasTriedSubmit) return;
    setErrors((prev) => {
      const next = { ...prev };
      validateFieldDirect(fieldKey, value, next);
      return next;
    });
  };

  useEffect(() => {
    if (!hasTriedSubmit) return;

    const stepErrors: Record<string, string> = {};

    if (step === 0) {
      validateFieldDirect('totalEmployees', totalEmployees, stepErrors);
      validateFieldDirect('femaleEmployees', femaleEmployees, stepErrors);
      validateFieldDirect('totalSalaryFund', totalSalaryFund, stepErrors);
    } else if (step === 1) {
      const summaryFields = [
        'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan', 'tongLaoDongNuBiNan',
        'tongSoNguoiChet', 'tongSoThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet',
        'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi',
        'thietHaiTaiSan'
      ];
      for (const f of summaryFields) {
        validateFieldDirect(`tnldSummary_${f}`, tnldSummary[f], stepErrors);
      }
      if (Number(tnldSummary.tongSoVu || 0) > 0) {
        for (let idx = 0; idx < accidentDetails.length; idx++) {
          const detail = accidentDetails[idx];
          validateFieldDirect(`accidentDetails_${idx}_nguyenNhanId`, detail.nguyenNhanId, stepErrors);
          validateFieldDirect(`accidentDetails_${idx}_yeuToChanThuongId`, detail.yeuToChanThuongId, stepErrors);
          validateFieldDirect(`accidentDetails_${idx}_ngheNghiepId`, detail.ngheNghiepId, stepErrors);
          for (const f of summaryFields) {
            validateFieldDirect(`accidentDetails_${idx}_${f}`, detail.stats?.[f], stepErrors);
          }
        }
      }
    } else if (step === 2) {
      const summaryFields = [
        'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan', 'tongLaoDongNuBiNan',
        'tongSoNguoiChet', 'tongSoThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet',
        'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi',
        'thietHaiTaiSan'
      ];
      for (const f of summaryFields) {
        validateFieldDirect(`tnldTroCapSummary_${f}`, tnldTroCapSummary[f], stepErrors);
      }
    }

    setErrors(stepErrors);
  }, [step, totalEmployees, femaleEmployees, totalSalaryFund, tnldSummary, tnldTroCapSummary, accidentDetails, hasTriedSubmit]);

  // Print ref
  const printComponentRef = useRef(null);
  const triggerPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Bao_cao_tai_nan_lao_dong_${period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${selectedYear}`,
  });

  const handleExportWord = async () => {
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

      const sourceDetails = accidentDetails || [];
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
        companyName: myCompany?.name || "",
        period: period === 'CA_NAM' ? 'cả năm' : '6 tháng',
        totalEmployees: totalEmployees || "0",
        femaleEmployees: femaleEmployees || "0",
        totalSalary: totalSalaryFund || "0",
        companyField: myCompany?.businessLine?.tennganh || "",

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
      saveAs(out, `Bao_cao_tai_nan_lao_dong_${period === 'CA_NAM' ? 'Ca_nam' : '6_thang'}_${selectedYear}.docx`);
    } catch (error) {
      console.error("Export word error", error);
      enqueueSnackbar("Lỗi khi xuất file Word", { variant: 'error' });
    }
  };

  const years = useMemo(() => {
    const arr = [];
    const current = new Date().getFullYear();
    const startYear = myCompany?.createdAt ? new Date(myCompany.createdAt).getFullYear() : 2022;
    for (let y = current; y >= startYear; y--) {
      arr.push(y);
    }
    if (arr.length === 0) {
      arr.push(current);
    }
    return arr;
  }, [myCompany]);

  // On mount: fetch company details and dropdown values
  useEffect(() => {
    const initData = async () => {
      try {
        const companyRes: any = await DoetService.getMyCompany();
        setMyCompany(companyRes?.data || companyRes);
      } catch (err) {
        console.error("Error loading company details", err);
      }

      try {
        const factorsRes: any = await DoetService.getInjuryFactors();
        const items = factorsRes?.data || factorsRes || [];
        if (Array.isArray(items) && items.length > 0) {
          const mapped = items.map((f: any) => {
            if (f.name === 'Thiết bị nâng' || f.id === 4) {
              return { ...f, id: 101 };
            }
            return f;
          });
          setInjuryFactors(mapped);
        } else {
          // Hardcoded fallback matching seeds
          setInjuryFactors([
            { id: 1, name: "Điện" },
            { id: 2, name: "Phóng xạ" },
            { id: 3, name: "Thiết bị áp lực" },
            { id: 101, name: "Thiết bị nâng" },
            { id: 5, name: "Bộ phận truyền động..." },
            { id: 6, name: "Vật văng bắn" },
            { id: 7, name: "Vật rơi, đổ, sập" },
            { id: 8, name: "Sập đổ công trình, giàn giáo" },
            { id: 9, name: "Sập lò, sập đất đá" }
          ]);
        }
      } catch (err) {
        console.error("Error fetching injury factors dropdown", err);
      }
    };
    initData();
  }, []);

  // Fetch active report periods configured by DOET for the selected year
  const fetchActivePeriods = async () => {
    try {
      const res: any = await reportPeriodService.getForEnterprise({ year: selectedYear, status: 'ACTIVE' });
      const items = res?.data?.items || res?.items || [];
      setActivePeriods(items);
    } catch (err) {
      console.error("Error fetching active report periods", err);
    }
  };

  // Fetch reports list matching the current year
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res: any = await periodicReportService.getAll({ year: selectedYear });
      const items = res?.data?.items || res?.items || [];
      setExistingReports(items);
    } catch (err) {
      console.error("Error fetching reports list", err);
      enqueueSnackbar("Lỗi khi tải danh sách báo cáo", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchActivePeriods();
  }, [selectedYear, mode]);

  // Construct table rows dynamically
  const tableRows = useMemo(() => {
    return activePeriods.map((row) => {
      const report = existingReports.find(r => r.period === row.period);
      let status = 'CHO_BAO_CAO';
      let statusLabel = 'Chờ báo cáo';
      let statusColor = '#94a3b8'; // Grey

      if (row.displayStatus === 'HET_HAN' && !report) {
        status = 'HET_HAN';
        statusLabel = 'Hết hạn báo cáo';
        statusColor = '#cbd5e1'; // Faded grey
      } else if (report) {
        status = report.status;
        if (status === 'DANG_BAO_CAO') {
          statusLabel = 'Đang báo cáo';
          statusColor = '#1b3b87'; // Dark blue
        } else if (status === 'CHO_XET_DUYET') {
          statusLabel = 'Chờ xét duyệt';
          statusColor = '#f59e0b'; // Yellow
        } else if (status === 'DA_TIEP_NHAN') {
          statusLabel = 'Đã tiếp nhận';
          statusColor = '#2e7d32'; // Green
        } else if (status === 'HUY_TIEP_NHAN') {
          statusLabel = 'Hủy tiếp nhận';
          statusColor = '#ef4444'; // Red
        }
      }

      const periodName = row.period === 'CA_NAM' ? 'Cả năm' : '6 tháng';

      return {
        period: row.period,
        periodName: periodName,
        status,
        statusLabel,
        statusColor,
        reportId: report?.id || null,
        reportData: report || null
      };
    });
  }, [existingReports, activePeriods]);

  // Enter edit mode
  const handleStartEdit = async (row: any) => {
    if (row.status === 'HET_HAN') {
      enqueueSnackbar("Kỳ báo cáo này đã hết hạn, không thể khai báo hoặc chỉnh sửa.", { variant: 'error' });
      return;
    }
    if (row.status === 'DA_TIEP_NHAN' || row.status === 'CHO_XET_DUYET') {
      enqueueSnackbar("Báo cáo đang chờ xét duyệt hoặc đã được tiếp nhận, không thể chỉnh sửa.", { variant: 'error' });
      return;
    }
    setPeriod(row.period);
    setStep(0);
    setTabIndex(0);
    setHasTriedSubmit(false);
    setErrors({});

    if (row.reportId) {
      setLoading(true);
      try {
        const detailRes: any = await periodicReportService.getById(row.reportId);
        const report = detailRes?.data || detailRes;

        setActiveReportId(report.id);
        setTotalEmployees(String(report.totalEmployees || ''));
        setFemaleEmployees(String(report.femaleEmployees || ''));
        setTotalSalaryFund(formatNumberWithDots(report.totalSalaryFund));
        setReportFileUrl(report.reportFileUrl || '');
        setReportFileName(report.reportFileName || '');
        setCurrentRejectReason(report.rejectReason || '');

        setTnldSummary(convertStatsToStrings({
          ...(report.tnldSummary || {}),
          tongLaoDongNuBiNan: report.tnldSummary?.tongLaoDongNuBiNan ?? report.tnldSummary?.tongSoNuBiNan ?? 0,
        }));

        setTnldTroCapSummary(convertStatsToStrings({
          ...(report.tnldTroCapSummary || {}),
          tongLaoDongNuBiNan: report.tnldTroCapSummary?.tongLaoDongNuBiNan ?? report.tnldTroCapSummary?.tongSoNuBiNan ?? 0,
        }));

        const details = (report.accidentDetails || []).map((d: any) => ({
          ...d,
          stats: convertStatsToStrings({
            ...(d.stats || {}),
            tongLaoDongNuBiNan: d.stats?.tongLaoDongNuBiNan ?? d.stats?.tongSoNuBiNan ?? 0
          })
        }));
        setAccidentDetails(details);
        setMode('edit');
      } catch (err) {
        console.error("Error loading report detail", err);
        enqueueSnackbar("Lỗi khi tải chi tiết báo cáo", { variant: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      // Create new draft template
      setActiveReportId(null);
      setTotalEmployees('');
      setFemaleEmployees('');
      setTotalSalaryFund('');
      setTnldSummary(createDefaultStats());
      setTnldTroCapSummary(createDefaultStats());
      setAccidentDetails([]);
      setReportFileUrl('');
      setReportFileName('');
      setCurrentRejectReason('');
      setMode('edit');
    }
  };

  // Enter view-only mode
  const handleStartView = async (row: any) => {
    setPeriod(row.period);
    setStep(3); // review step
    setActiveReportId(row.reportId);
    setHasTriedSubmit(false);
    setErrors({});

    setLoading(true);
    try {
      const detailRes: any = await periodicReportService.getById(row.reportId);
      const report = detailRes?.data || detailRes;

      setTotalEmployees(String(report.totalEmployees || ''));
      setFemaleEmployees(String(report.femaleEmployees || ''));
      setTotalSalaryFund(formatNumberWithDots(report.totalSalaryFund));
      setReportFileUrl(report.reportFileUrl || '');
      setReportFileName(report.reportFileName || '');

      setTnldSummary(convertStatsToStrings({
        ...(report.tnldSummary || {}),
        tongLaoDongNuBiNan: report.tnldSummary?.tongLaoDongNuBiNan ?? report.tnldSummary?.tongSoNuBiNan ?? 0,
      }));

      setTnldTroCapSummary(convertStatsToStrings({
        ...(report.tnldTroCapSummary || {}),
        tongLaoDongNuBiNan: report.tnldTroCapSummary?.tongLaoDongNuBiNan ?? report.tnldTroCapSummary?.tongSoNuBiNan ?? 0,
      }));

      const details = (report.accidentDetails || []).map((d: any) => ({
        ...d,
        stats: convertStatsToStrings({
          ...(d.stats || {}),
          tongLaoDongNuBiNan: d.stats?.tongLaoDongNuBiNan ?? d.stats?.tongSoNuBiNan ?? 0
        })
      }));
      setAccidentDetails(details);
      setMode('view');
    } catch (err) {
      console.error("Error loading report detail", err);
      enqueueSnackbar("Lỗi khi tải chi tiết báo cáo", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step changes dropdown handler
  const handleStepSelectChange = async (newStep: number) => {
    // Run validation checks on current step and previous steps before jumping forward
    if (newStep > step) {
      for (let s = step; s < newStep; s++) {
        if (!validateStep(s)) {
          return;
        }
      }
    }
    setLoading(true);
    try {
      const payload = buildPayload('DANG_BAO_CAO');
      if (activeReportId) {
        await periodicReportService.update(activeReportId, payload);
      } else {
        const res: any = await periodicReportService.create(payload);
        const newId = res?.data?.id || res?.id;
        if (newId) setActiveReportId(newId);
      }
    } catch (err: any) {
      console.error("Error auto-saving draft on step change", err);
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi tự động lưu nháp", { variant: 'error' });
    } finally {
      setLoading(false);
      setStep(newStep);
      setHasTriedSubmit(false);
      setErrors({});
    }
  };

  // Run validation of a specific step index
  const validateStep = (stepIndex: number, silent: boolean = false): boolean => {
    if (!silent) {
      setHasTriedSubmit(true);
    }
    const error = (msg: string) => {
      if (!silent) enqueueSnackbar(msg, { variant: 'error' });
      return false;
    };

    if (stepIndex === 0) {
      const stepErrors: Record<string, string> = {};
      const v1 = validateFieldDirect('totalEmployees', totalEmployees, stepErrors);
      const v2 = validateFieldDirect('femaleEmployees', femaleEmployees, stepErrors);
      const v3 = validateFieldDirect('totalSalaryFund', totalSalaryFund, stepErrors);
      setErrors(prev => ({ ...prev, ...stepErrors }));
      if (!v1 || !v2 || !v3) {
        const firstMsg = stepErrors['totalEmployees'] || stepErrors['femaleEmployees'] || stepErrors['totalSalaryFund'];
        return error(firstMsg);
      }
    }

    if (stepIndex === 1) {
      const stepErrors: Record<string, string> = {};
      let isValid = true;
      let firstMsg = '';

      const summaryFields = [
        'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan', 'tongLaoDongNuBiNan',
        'tongSoNguoiChet', 'tongSoThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet',
        'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi',
        'thietHaiTaiSan'
      ];
      for (const f of summaryFields) {
        const v = validateFieldDirect(`tnldSummary_${f}`, tnldSummary[f], stepErrors);
        if (!v) {
          isValid = false;
          if (!firstMsg) firstMsg = stepErrors[`tnldSummary_${f}`];
        }
      }

      if (Number(tnldSummary.tongSoVu || 0) > 0) {
        for (let idx = 0; idx < accidentDetails.length; idx++) {
          const detail = accidentDetails[idx];
          if (!detail.nguyenNhanId || !detail.yeuToChanThuongId || !detail.ngheNghiepId) {
            isValid = false;
            if (!firstMsg) firstMsg = `Vụ tai nạn #${idx + 1}: Chưa nhập đầy đủ thông tin phân loại`;
          }
          for (const f of summaryFields) {
            const v = validateFieldDirect(`accidentDetails_${idx}_${f}`, detail.stats?.[f], stepErrors);
            if (!v) {
              isValid = false;
              if (!firstMsg) firstMsg = `Vụ tai nạn #${idx + 1}: ` + stepErrors[`accidentDetails_${idx}_${f}`];
            }
          }
        }
      }

      setErrors(prev => ({ ...prev, ...stepErrors }));
      if (!isValid) {
        return error(firstMsg || "Vui lòng kiểm tra lại các lỗi nhập liệu");
      }

      // Parity check between tnldSummary and accidentDetails
      const tongVu = parseInt(tnldSummary.tongSoVu || 0);
      if (tongVu > 0) {
        let sumVu = 0, sumVuChet = 0, sumVu2Nguoi = 0;
        let sumNguoiNan = 0, sumNuNan = 0, sumNguoiChet = 0, sumThuongNang = 0;
        let sumKqNan = 0, sumKqNuNan = 0, sumKqChet = 0, sumKqThuongNang = 0;
        let sumYTe = 0, sumTraLuong = 0, sumBoiThuong = 0, sumNgayNghi = 0, sumTaiSan = 0;

        for (const detail of accidentDetails) {
          const stats = detail.stats || {};
          sumVu += parseInt(stats.tongSoVu || 0);
          sumVuChet += parseInt(stats.tongSoVuNguoiChet || 0);
          sumVu2Nguoi += parseInt(stats.tongSoVu2Nguoi || 0);
          sumNguoiNan += parseInt(stats.tongSoNguoiBiNan || 0);
          sumNuNan += parseInt(stats.tongLaoDongNuBiNan ?? stats.tongSoNuBiNan ?? 0);
          sumNguoiChet += parseInt(stats.tongSoNguoiChet || 0);
          sumThuongNang += parseInt(stats.tongSoThuongNang || 0);
          sumKqNan += parseInt(stats.khongQlNguoiBiNan || 0);
          sumKqNuNan += parseInt(stats.khongQlNuBiNan || 0);
          sumKqChet += parseInt(stats.khongQlNguoiChet || 0);
          sumKqThuongNang += parseInt(stats.khongQlThuongNang || 0);
          sumYTe += parseFloat(stats.chiPhiYTe || 0);
          sumTraLuong += parseFloat(stats.chiPhiTraLuong || 0);
          sumBoiThuong += parseFloat(stats.chiPhiBoiThuong || 0);
          sumNgayNghi += parseInt(stats.tongNgayNghi || 0);
          sumTaiSan += parseFloat(stats.thietHaiTaiSan || 0);
        }

        const tongVuChet = parseInt(tnldSummary.tongSoVuNguoiChet || 0);
        const tongVu2Nguoi = parseInt(tnldSummary.tongSoVu2Nguoi || 0);
        const tongNguoiNan = parseInt(tnldSummary.tongSoNguoiBiNan || 0);
        const tongNuNan = parseInt(tnldSummary.tongLaoDongNuBiNan ?? tnldSummary.tongSoNuBiNan ?? 0);
        const tongNguoiChet = parseInt(tnldSummary.tongSoNguoiChet || 0);
        const tongThuongNang = parseInt(tnldSummary.tongSoThuongNang || 0);
        const khongQlNan = parseInt(tnldSummary.khongQlNguoiBiNan || 0);
        const khongQlNuNan = parseInt(tnldSummary.khongQlNuBiNan || 0);
        const khongQlChet = parseInt(tnldSummary.khongQlNguoiChet || 0);
        const khongQlThuongNang = parseInt(tnldSummary.khongQlThuongNang || 0);
        const chiPhiYTe = parseFloat(tnldSummary.chiPhiYTe || 0);
        const chiPhiTraLuong = parseFloat(tnldSummary.chiPhiTraLuong || 0);
        const chiPhiBoiThuong = parseFloat(tnldSummary.chiPhiBoiThuong || 0);
        const tongNgayNghi = parseInt(tnldSummary.tongNgayNghi || 0);
        const thietHaiTaiSan = parseFloat(tnldSummary.thietHaiTaiSan || 0);

        if (sumVu !== tongVu) return error(`Tổng số vụ chi tiết (${sumVu}) không khớp với tổng kết đã khai báo (${tongVu})`);
        if (sumVuChet !== tongVuChet) return error(`Tổng số vụ có người chết trong chi tiết (${sumVuChet}) không khớp với tổng kết đã khai báo (${tongVuChet})`);
        if (sumVu2Nguoi !== tongVu2Nguoi) return error(`Tổng số vụ có 2 người bị nạn trở lên trong chi tiết (${sumVu2Nguoi}) không khớp với tổng kết đã khai báo (${tongVu2Nguoi})`);
        if (sumNguoiNan !== tongNguoiNan) return error(`Tổng số người bị nạn trong chi tiết (${sumNguoiNan}) không khớp với tổng kết đã khai báo (${tongNguoiNan})`);
        if (sumNuNan !== tongNuNan) return error(`Tổng số lao động nữ bị nạn trong chi tiết (${sumNuNan}) không khớp với tổng kết đã khai báo (${tongNuNan})`);
        if (sumNguoiChet !== tongNguoiChet) return error(`Tổng số người chết trong chi tiết (${sumNguoiChet}) không khớp với tổng kết đã khai báo (${tongNguoiChet})`);
        if (sumThuongNang !== tongThuongNang) return error(`Tổng số người bị thương nặng trong chi tiết (${sumThuongNang}) không khớp với tổng kết đã khai báo (${tongThuongNang})`);
        if (sumKqNan !== khongQlNan) return error(`Số nạn nhân không quản lý trong chi tiết (${sumKqNan}) không khớp với tổng kết đã khai báo (${khongQlNan})`);
        if (sumKqNuNan !== khongQlNuNan) return error(`Số lao động nữ bị nạn không quản lý trong chi tiết (${sumKqNuNan}) không khớp với tổng kết đã khai báo (${khongQlNuNan})`);
        if (sumKqChet !== khongQlChet) return error(`Số người chết không quản lý trong chi tiết (${sumKqChet}) không khớp với tổng kết đã khai báo (${khongQlChet})`);
        if (sumKqThuongNang !== khongQlThuongNang) return error(`Số người bị thương nặng không quản lý trong chi tiết (${sumKqThuongNang}) không khớp với tổng kết đã khai báo (${khongQlThuongNang})`);
        if (sumYTe !== chiPhiYTe) return error(`Tổng chi phí y tế trong chi tiết (${sumYTe.toLocaleString('vi-VN')}) không khớp với tổng kết đã khai báo (${chiPhiYTe.toLocaleString('vi-VN')})`);
        if (sumTraLuong !== chiPhiTraLuong) return error(`Tổng chi phí trả lương trong chi tiết (${sumTraLuong.toLocaleString('vi-VN')}) không khớp với tổng kết đã khai báo (${chiPhiTraLuong.toLocaleString('vi-VN')})`);
        if (sumBoiThuong !== chiPhiBoiThuong) return error(`Tổng chi phí bồi thường trong chi tiết (${sumBoiThuong.toLocaleString('vi-VN')}) không khớp với tổng kết đã khai báo (${sumBoiThuong.toLocaleString('vi-VN')})`);
        if (sumNgayNghi !== tongNgayNghi) return error(`Tổng số ngày nghỉ trong chi tiết (${sumNgayNghi}) không khớp với tổng kết đã khai báo (${tongNgayNghi})`);
        if (sumTaiSan !== thietHaiTaiSan) return error(`Tổng thiệt hại tài sản trong chi tiết (${sumTaiSan.toLocaleString('vi-VN')}) không khớp với tổng kết đã khai báo (${thietHaiTaiSan.toLocaleString('vi-VN')})`);
      }
    }

    if (stepIndex === 2) {
      const stepErrors: Record<string, string> = {};
      let isValid = true;
      let firstMsg = '';

      const summaryFields = [
        'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan', 'tongLaoDongNuBiNan',
        'tongSoNguoiChet', 'tongSoThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet',
        'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi',
        'thietHaiTaiSan'
      ];
      for (const f of summaryFields) {
        const v = validateFieldDirect(`tnldTroCapSummary_${f}`, tnldTroCapSummary[f], stepErrors);
        if (!v) {
          isValid = false;
          if (!firstMsg) firstMsg = stepErrors[`tnldTroCapSummary_${f}`];
        }
      }

      setErrors(prev => ({ ...prev, ...stepErrors }));
      if (!isValid) {
        return error(firstMsg || "Vui lòng kiểm tra lại các lỗi nhập liệu");
      }
    }

    return true;
  };



  // Advanced logic step transitions (Tiếp tục button)
  const handleNextStep = async () => {
    if (step < 3) {
      if (validateStep(step)) {
        setLoading(true);
        try {
          const payload = buildPayload('DANG_BAO_CAO');
          if (activeReportId) {
            await periodicReportService.update(activeReportId, payload);
          } else {
            const res: any = await periodicReportService.create(payload);
            const newId = res?.data?.id || res?.id;
            if (newId) {
              setActiveReportId(newId);
            }
          }
          setStep(step + 1);
          setHasTriedSubmit(false);
          setErrors({});
        } catch (err: any) {
          console.error("Error auto-saving draft", err);
          enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi tự động lưu nháp", { variant: 'error' });
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleGoBack = async () => {
    if (step > 0) {
      setLoading(true);
      try {
        const payload = buildPayload('DANG_BAO_CAO');
        if (activeReportId) {
          await periodicReportService.update(activeReportId, payload);
        } else {
          const res: any = await periodicReportService.create(payload);
          const newId = res?.data?.id || res?.id;
          if (newId) setActiveReportId(newId);
        }
      } catch (err: any) {
        console.error("Error auto-saving draft on back", err);
        enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi tự động lưu nháp", { variant: 'error' });
      } finally {
        setLoading(false);
        setStep(step - 1);
        setHasTriedSubmit(false);
        setErrors({});
      }
    }
  };

  // Upload file to local folder via backend service
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      enqueueSnackbar("Chỉ chấp nhận file định dạng PDF, JPG, JPEG, PNG", { variant: 'error' });
      return;
    }

    setUploadingFile(true);
    try {
      const res: any = await DoetService.uploadFile(file);
      setReportFileUrl(res?.fileUrl || res?.data?.fileUrl || '');
      setReportFileName(res?.fileName || res?.data?.fileName || file.name || '');
      enqueueSnackbar("Tải lên báo cáo thành công", { variant: 'success' });
    } catch (err) {
      console.error("Error uploading file", err);
      enqueueSnackbar("Lỗi tải lên báo cáo", { variant: 'error' });
    } finally {
      setUploadingFile(false);
    }
  };

  // Build the complete payload for saving
  const buildPayload = (statusVal: 'DANG_BAO_CAO' | 'CHO_XET_DUYET') => {
    // Strip formatting dots before mapping stats values
    const cleanStats = (s: any, isDetail = false) => {
      const femaleNum = Number(s.tongLaoDongNuBiNan ?? s.tongSoNuBiNan ?? 0);
      
      let tongSoVu = Number(s.tongSoVu || 0);
      let tongSoVuNguoiChet = Number(s.tongSoVuNguoiChet || 0);
      let tongSoVu2Nguoi = Number(s.tongSoVu2Nguoi || 0);

      if (isDetail) {
        tongSoVu = 1;
        const numDead = Number(s.tongSoNguoiChet || 0);
        tongSoVuNguoiChet = numDead > 0 ? 1 : 0;
        const numVictims = Number(s.tongSoNguoiBiNan || 0);
        tongSoVu2Nguoi = numVictims >= 2 ? 1 : 0;
      }

      return {
        tongSoVu,
        tongSoVuNguoiChet,
        tongSoVu2Nguoi,
        tongSoNguoiBiNan: Number(s.tongSoNguoiBiNan || 0),
        tongSoNuBiNan: femaleNum,
        tongLaoDongNuBiNan: femaleNum,
        tongSoNguoiChet: Number(s.tongSoNguoiChet || 0),
        tongSoThuongNang: Number(s.tongSoThuongNang || 0),
        khongQlNguoiBiNan: Number(s.khongQlNguoiBiNan || 0),
        khongQlNuBiNan: Number(s.khongQlNuBiNan || 0),
        khongQlNguoiChet: Number(s.khongQlNguoiChet || 0),
        khongQlThuongNang: Number(s.khongQlThuongNang || 0),
        chiPhiYTe: parseFormattedNumber(s.chiPhiYTe),
        chiPhiTraLuong: parseFormattedNumber(s.chiPhiTraLuong),
        chiPhiBoiThuong: parseFormattedNumber(s.chiPhiBoiThuong),
        tongChiPhi: parseFormattedNumber(s.tongChiPhi),
        tongNgayNghi: Number(s.tongNgayNghi || 0),
        thietHaiTaiSan: parseFormattedNumber(s.thietHaiTaiSan)
      };
    };

    const details = accidentDetails.map(d => ({
      reportType: d.reportType || 'TAI_NAN_LAO_DONG',
      nguyenNhanId: Number(d.nguyenNhanId),
      yeuToChanThuongId: Number(d.yeuToChanThuongId),
      ngheNghiepId: Number(d.ngheNghiepId),
      stats: cleanStats(d.stats, true)
    }));

    return {
      year: selectedYear,
      period,
      status: statusVal,
      totalEmployees: Number(totalEmployees),
      femaleEmployees: Number(femaleEmployees),
      totalSalaryFund: parseFormattedNumber(totalSalaryFund),
      tnldSummary: cleanStats(tnldSummary),
      tnldTroCapSummary: cleanStats(tnldTroCapSummary),
      accidentDetails: details,
      reportFileUrl,
      reportFileName,
      doetId: String(myCompany?.id || '')
    };
  };

  // Draft Save Handler
  const handleSaveDraft = async () => {
    for (let s = 0; s <= step; s++) {
      if (!validateStep(s)) {
        return;
      }
    }

    setLoading(true);
    try {
      const payload = buildPayload('DANG_BAO_CAO');
      if (activeReportId) {
        await periodicReportService.update(activeReportId, payload);
      } else {
        await periodicReportService.create(payload);
      }
      enqueueSnackbar("Lưu nháp báo cáo thành công", { variant: 'success' });
      setMode('list');
    } catch (err: any) {
      console.error("Error saving draft", err);
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi lưu nháp báo cáo", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Final Submit Handler
  const handleSubmitReport = async () => {
    // Validate all steps (0, 1, 2)
    for (let s = 0; s <= 2; s++) {
      if (!validateStep(s)) {
        return;
      }
    }

    if (!reportFileUrl) {
      enqueueSnackbar("Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty", { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload('CHO_XET_DUYET');
      if (activeReportId) {
        await periodicReportService.update(activeReportId, payload);
      } else {
        await periodicReportService.create(payload);
      }
      enqueueSnackbar("Gửi báo cáo lên sở thành công", { variant: 'success' });
      setMode('list');
    } catch (err: any) {
      console.error("Error submitting report", err);
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi gửi báo cáo", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-updating Tab 1 Cost Calculations
  const updateSummaryCost = (field: string, val: string, isTroCap: boolean = false) => {
    let cleaned = val.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    if (cleaned === '') {
      cleaned = '0';
    }

    const setStats = isTroCap ? setTnldTroCapSummary : setTnldSummary;

    setStats((prev: any) => {
      const newStats = { ...prev, [field]: cleaned };
      const yTe = parseFormattedNumber(newStats.chiPhiYTe || 0);
      const luong = parseFormattedNumber(newStats.chiPhiTraLuong || 0);
      const boiThuong = parseFormattedNumber(newStats.chiPhiBoiThuong || 0);
      newStats.tongChiPhi = yTe + luong + boiThuong;
      return newStats;
    });
  };

  // Auto-updating Accident Detail Cost Calculations
  const updateDetailCost = (index: number, field: string, val: string) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    if (cleaned === '') {
      cleaned = '0';
    }

    setAccidentDetails((prev) => {
      const list = [...prev];
      const detail = { ...list[index] };
      const newStats = { ...detail.stats, [field]: cleaned };
      const yTe = parseFormattedNumber(newStats.chiPhiYTe || 0);
      const luong = parseFormattedNumber(newStats.chiPhiTraLuong || 0);
      const boiThuong = parseFormattedNumber(newStats.chiPhiBoiThuong || 0);
      newStats.tongChiPhi = yTe + luong + boiThuong;
      detail.stats = newStats;
      list[index] = detail;
      return list;
    });
  };

  // General field changes inside Tab 1 Summary
  const handleSummaryFieldChange = (field: string, val: string, isTroCap: boolean = false) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    if (cleaned === '') {
      cleaned = '0';
    }
    const setStats = isTroCap ? setTnldTroCapSummary : setTnldSummary;
    setStats((prev: any) => ({ ...prev, [field]: cleaned }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 1) {
      // Validate tab 1 fields
      const stepErrors: Record<string, string> = {};
      let isValid = true;
      let firstMsg = '';

      const summaryFields = [
        'tongSoVu', 'tongSoVuNguoiChet', 'tongSoVu2Nguoi', 'tongSoNguoiBiNan', 'tongLaoDongNuBiNan',
        'tongSoNguoiChet', 'tongSoThuongNang', 'khongQlNguoiBiNan', 'khongQlNuBiNan', 'khongQlNguoiChet',
        'khongQlThuongNang', 'chiPhiYTe', 'chiPhiTraLuong', 'chiPhiBoiThuong', 'tongChiPhi', 'tongNgayNghi',
        'thietHaiTaiSan'
      ];
      for (const f of summaryFields) {
        const v = validateFieldDirect(`tnldSummary_${f}`, tnldSummary[f], stepErrors);
        if (!v) {
          isValid = false;
          if (!firstMsg) firstMsg = stepErrors[`tnldSummary_${f}`];
        }
      }

      setHasTriedSubmit(true);
      setErrors(prev => ({ ...prev, ...stepErrors }));

      if (!isValid) {
        enqueueSnackbar(firstMsg || "Vui lòng hoàn thành thông tin tổng hợp trước khi xem chi tiết", { variant: 'error' });
        return;
      }

      const numVu = parseInt(tnldSummary.tongSoVu || 0);
      if (numVu === 1) {
        setAccidentDetails((prev) => {
          if (prev.length === 0) {
            return [{
              reportType: 'TAI_NAN_LAO_DONG',
              nguyenNhanId: '',
              yeuToChanThuongId: '',
              ngheNghiepId: '',
              stats: { ...tnldSummary, tongSoVu: '1' }
            }];
          }
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            stats: { ...tnldSummary, tongSoVu: '1' }
          };
          return updated;
        });
      }
    }
    setTabIndex(newValue);
  };

  // Sync accordion rows if "Tổng số vụ" in Tab 1 changes
  const handleTongSoVuChange = (val: string) => {
    let cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1 && cleaned.startsWith('0')) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    if (cleaned === '') {
      cleaned = '0';
    }
    const num = parseInt(cleaned) || 0;

    // Validate count limit
    if (num > 100) {
      enqueueSnackbar("Số lượng chi tiết vụ tai nạn vượt quá giới hạn (tối đa 100)", { variant: 'warning' });
      return;
    }

    setTnldSummary((prev: any) => ({ ...prev, tongSoVu: cleaned }));

    setAccidentDetails((prev) => {
      const statsInit = createDefaultStats();
      statsInit.tongSoVu = '1'; // individual case is always 1 case

      if (num === prev.length) return prev;

      // If we are changing from 1 to multiple cases, reset the first element's stats to empty
      let baseList = prev;
      if (prev.length === 1 && num >= 2) {
        baseList = [{
          ...prev[0],
          stats: { ...statsInit }
        }];
      }

      if (num < prev.length) return baseList.slice(0, num);

      const added = [];
      for (let i = baseList.length; i < num; i++) {
        added.push({
          reportType: 'TAI_NAN_LAO_DONG',
          nguyenNhanId: '',
          yeuToChanThuongId: '',
          ngheNghiepId: '',
          stats: { ...statsInit }
        });
      }
      return [...baseList, ...added];
    });
  };

  // Change fields in Tab 2 detail items
  const handleDetailFieldChange = (index: number, field: string, val: any, isStats = false) => {
    let processedVal = val;
    if (isStats && typeof val === 'string') {
      let cleaned = val.replace(/[^0-9]/g, '');
      if (cleaned.length > 1 && cleaned.startsWith('0')) {
        cleaned = cleaned.replace(/^0+/, '');
      }
      if (cleaned === '') {
        cleaned = '0';
      }
      processedVal = cleaned;
    }
    setAccidentDetails((prev) => {
      const list = [...prev];
      const d = { ...list[index] };
      if (isStats) {
        const nextStats = { ...d.stats, [field]: processedVal };
        nextStats.tongSoVu = '1';
        const numDead = parseInt(nextStats.tongSoNguoiChet || '0') || 0;
        nextStats.tongSoVuNguoiChet = numDead > 0 ? '1' : '0';
        const numVictims = parseInt(nextStats.tongSoNguoiBiNan || '0') || 0;
        nextStats.tongSoVu2Nguoi = numVictims >= 2 ? '1' : '0';
        d.stats = nextStats;
      } else {
        d[field] = processedVal;
      }
      list[index] = d;
      return list;
    });
  };

  // Grid styling helpers
  const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#475569' };
  const cellStyle = { border: '1px solid #e2e8f0', borderColor: '#e2e8f0' };
  const headStyle = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f8fafc', color: '#475569', padding: '10px 8px' };

  return (
    <Box className={classes.root}>
      {/* -------------------- 1. LIST SCREEN (mode === 'list') -------------------- */}
      {mode === 'list' && (
        <>
          <Box className={classes.pageHeader}>
            <Typography className={classes.headerTitle}>
              Báo cáo định kỳ Tai nạn lao động
            </Typography>
            <Box className={classes.actions}>
              <Select
                size="small"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={classes.filterField}
                sx={{ minWidth: 120 }}
                MenuProps={{ slotProps: { paper: { sx: { minWidth: 120 } } } }}
              >
                {years.map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          <Box className={classes.mainContent}>
            <Box className={classes.card}>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.headerCell} width={100} align="center">Thao tác</TableCell>
                      <TableCell className={classes.headerCell}>Tên doanh nghiệp</TableCell>
                      <TableCell className={classes.headerCell} width={180}>Mã số thuế</TableCell>
                      <TableCell className={classes.headerCell} width={180}>Kỳ báo cáo</TableCell>
                      <TableCell className={classes.headerCell} width={180}>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : tableRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Không có kỳ báo cáo hoạt động nào được cấu hình cho năm {selectedYear}
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableRows.map((row) => (
                        <TableRow key={row.period} hover>
                          <TableCell className={classes.bodyCell} align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              {row.reportId && (
                                <IconButton
                                  size="small"
                                  className={classes.actionIcon}
                                  onClick={() => handleStartView(row)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              )}
                              {row.status !== 'DA_TIEP_NHAN' && row.status !== 'CHO_XET_DUYET' && row.status !== 'HET_HAN' && (
                                <IconButton
                                  size="small"
                                  className={classes.actionIcon}
                                  onClick={() => handleStartEdit(row)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell className={classes.bodyCell} sx={{ fontWeight: 500 }}>
                            {myCompany?.name || '--'}
                          </TableCell>
                          <TableCell className={classes.bodyCell}>
                            {myCompany?.taxCode || '--'}
                          </TableCell>
                          <TableCell className={classes.bodyCell}>
                            {row.periodName}
                          </TableCell>
                          <TableCell className={classes.bodyCell}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: row.statusColor }} />
                              <Typography variant="body2" sx={{ fontWeight: 600, color: row.statusColor }}>
                                {row.statusLabel}
                              </Typography>
                              {row.status === 'HUY_TIEP_NHAN' && row.reportData?.rejectReason && (
                                <Tooltip title="Xem lý do hủy" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setCurrentRejectReason(row.reportData.rejectReason);
                                      setRejectReasonDialogOpen(true);
                                    }}
                                    sx={{ color: '#ef4444', p: 0.3 }}
                                  >
                                    <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </>
      )}

      {mode === 'edit' && (
        <>
          <Box className={classes.pageHeader}>
            <Typography className={classes.headerTitle}>
              Báo cáo định kỳ Tai nạn lao động
            </Typography>
            <Box className={classes.actions}>
              {step < 3 && (
                <TextField
                  size="small"
                  disabled
                  value={selectedYear}
                  className={classes.filterField}
                  sx={{ width: 100 }}
                  slotProps={{ htmlInput: { style: { textAlign: 'center', fontWeight: 'bold' } } }}
                />
              )}
              <Button
                disableRipple
                onClick={() => setCancelDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  color: '#666',
                  fontSize: '0.85rem',
                  borderRadius: 1.5,
                  padding: '4px 16px',
                  minWidth: 'auto',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#f5f5f7',
                    color: '#333'
                  }
                }}
              >
                Huỷ bỏ
              </Button>
              {step > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeftIcon />}
                  sx={{ color: '#2f65f0', borderColor: '#cfd9f3', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, mr: 1 }}
                  onClick={handleGoBack}
                  disabled={loading}
                >
                  Quay lại
                </Button>
              )}
              {step < 3 && (
                <Button
                  variant="outlined"
                  endIcon={<ChevronRightIcon />}
                  sx={{ color: '#2f65f0', borderColor: '#cfd9f3', borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Tiếp tục
                </Button>
              )}
              {step === 3 && (
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  sx={{ color: '#2f65f0', borderColor: '#cfd9f3', borderRadius: 1.5, textTransform: 'none', fontWeight: 600, ml: 1 }}
                  onClick={handleExportWord}
                  disabled={loading}
                >
                  Xuất Word
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={step < 3 ? <SaveIcon /> : undefined}
                className={classes.addBtn}
                onClick={step < 3 ? handleSaveDraft : handleSubmitReport}
                disabled={loading}
              >
                {step < 3 ? 'Lưu' : 'Gửi báo cáo'}
              </Button>
            </Box>
          </Box>

          <Box className={classes.mainContent}>
            <Box className={classes.card} sx={{ p: 3 }}>
              {currentRejectReason && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Báo cáo này đã bị hủy tiếp nhận với lý do:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {currentRejectReason}
                  </Typography>
                </Alert>
              )}
              {/* Dropdown synchronize step selection */}
              <Autocomplete
                size="small"
                fullWidth
                sx={{ mb: 4, maxWidth: 600 }}
                options={[
                  { value: 0, label: 'Thông tin doanh nghiệp' },
                  { value: 1, label: '1. Tai nạn lao động' },
                  { value: 2, label: '2. Tai nạn lao động được hưởng trợ cấp theo quy định tại khoản 2 Điều 39 Luật ATVSLĐ' },
                  { value: 3, label: 'Xem tổng quan báo cáo tai nạn lao động' },
                ]}
                value={{
                  value: step, label: [
                    'Thông tin doanh nghiệp',
                    '1. Tai nạn lao động',
                    '2. Tai nạn lao động được hưởng trợ cấp theo quy định tại khoản 2 Điều 39 Luật ATVSLĐ',
                    'Xem tổng quan báo cáo tai nạn lao động'
                  ][step]
                }}
                onChange={(_, v) => v && handleStepSelectChange(v.value)}
                getOptionLabel={(opt) => opt.label}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                disableClearable
                renderInput={(params) => (
                  <TextField {...params} label="Chọn mục báo cáo" className={classes.field} />
                )}
              />

              {/* STEP 0: THÔNG TIN DOANH NGHIỆP */}
              {step === 0 && (
                <Box>
                  <Typography sx={{ color: 'primary.main', fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                    1. Thông tin công ty
                  </Typography>
                  <Typography sx={{ color: 'red', fontStyle: 'italic', mb: 3, fontSize: '0.85rem' }}>
                    *** Lưu ý: nhập tổng quỹ lương 6 tháng khi khai báo TNLĐ 6 tháng hoặc tổng quỹ lương 12 tháng khi khai báo TNLĐ cả năm.
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value={myCompany?.name || ''}
                        className={classes.field}
                        label="Tên công ty" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value={myCompany?.loaiHinhKinhDoanh?.tenloaihinh || ''}
                        className={classes.field}
                        label="Loại hình công ty" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value={myCompany?.businessLine?.tennganh || ''}
                        className={classes.field}
                        label="Ngành nghề kinh doanh" />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={totalEmployees}
                        onChange={(e) => {

                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setTotalEmployees(val);

                          if (errors['totalEmployees']) setErrors(prev => ({ ...prev, ['totalEmployees']: '' }));
                        }}
                        placeholder="Nhập tổng lao động..."
                        className={classes.field}
                        label={<RequiredLabel text="Tổng lao động của cơ sở" />}
                        error={!!errors['totalEmployees']}
                        helperText={errors['totalEmployees']}
                        onBlur={(e) => validateField('totalEmployees', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={femaleEmployees}
                        onChange={(e) => {

                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFemaleEmployees(val);

                          if (errors['femaleEmployees']) setErrors(prev => ({ ...prev, ['femaleEmployees']: '' }));
                        }}
                        placeholder="Nhập lao động nữ..."
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số lao động nữ" />}
                        error={!!errors['femaleEmployees']}
                        helperText={errors['femaleEmployees']}
                        onBlur={(e) => validateField('femaleEmployees', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={totalSalaryFund}
                        onChange={(e) => {

                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setTotalSalaryFund(formatNumberWithDots(val));

                          if (errors['totalSalaryFund']) setErrors(prev => ({ ...prev, ['totalSalaryFund']: '' }));
                        }}
                        placeholder="Nhập tổng quỹ lương..."
                        className={classes.field}
                        slotProps={{
                          input: {
                            endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 1 }}>(1.000đ)</Typography>
                          }
                        }}
                        label={<RequiredLabel text="Tổng quỹ lương" />}
                        error={!!errors['totalSalaryFund']}
                        helperText={errors['totalSalaryFund']}
                        onBlur={(e) => validateField('totalSalaryFund', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STEP 1: 1. TAI NẠN LAO ĐỘNG */}
              {step === 1 && (
                <Box>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabIndex} onChange={handleTabChange}>
                      <Tab label="(1) Tổng số vụ tai nạn lao động" sx={{ textTransform: 'none', fontWeight: 600 }} />
                      <Tab
                        label="(2) Chi tiết các vụ tai nạn lao động"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        disabled={Number(tnldSummary.tongSoVu || 0) <= 0}
                      />
                    </Tabs>
                  </Box>

                  <Typography sx={{ fontStyle: 'italic', mb: 2, fontSize: '0.85rem', fontWeight: 600 }}>
                    **** Doanh nghiệp xảy ra tai nạn lao động vui lòng nhập theo từng bước
                  </Typography>

                  {/* STEP 1 - TAB 1: TỔNG HỢP VỤ TAI NẠN */}
                  {tabIndex === 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                        1. Tổng số vụ tai nạn lao động & số nạn nhân tai nạn lao động
                      </Typography>

                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoVu || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleTongSoVuChange(val);

                              if (errors['tnldSummary_tongSoVu']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoVu']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số vụ" />}
                            error={!!errors['tnldSummary_tongSoVu']}
                            helperText={errors['tnldSummary_tongSoVu']}
                            onBlur={(e) => validateField('tnldSummary_tongSoVu', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoVuNguoiChet || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongSoVuNguoiChet', val);

                              if (errors['tnldSummary_tongSoVuNguoiChet']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoVuNguoiChet']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số vụ có người chết" />}
                            error={!!errors['tnldSummary_tongSoVuNguoiChet']}
                            helperText={errors['tnldSummary_tongSoVuNguoiChet']}
                            onBlur={(e) => validateField('tnldSummary_tongSoVuNguoiChet', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoVu2Nguoi || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongSoVu2Nguoi', val);

                              if (errors['tnldSummary_tongSoVu2Nguoi']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoVu2Nguoi']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số vụ có 2 người bị nạn trở lên" />}
                            error={!!errors['tnldSummary_tongSoVu2Nguoi']}
                            helperText={errors['tnldSummary_tongSoVu2Nguoi']}
                            onBlur={(e) => validateField('tnldSummary_tongSoVu2Nguoi', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoNguoiBiNan || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongSoNguoiBiNan', val);

                              if (errors['tnldSummary_tongSoNguoiBiNan']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoNguoiBiNan']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số người bị nạn" />}
                            error={!!errors['tnldSummary_tongSoNguoiBiNan']}
                            helperText={errors['tnldSummary_tongSoNguoiBiNan']}
                            onBlur={(e) => validateField('tnldSummary_tongSoNguoiBiNan', e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongLaoDongNuBiNan || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongLaoDongNuBiNan', val);

                              if (errors['tnldSummary_tongLaoDongNuBiNan']) setErrors(prev => ({ ...prev, ['tnldSummary_tongLaoDongNuBiNan']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số lao động nữ bị nạn" />}
                            error={!!errors['tnldSummary_tongLaoDongNuBiNan']}
                            helperText={errors['tnldSummary_tongLaoDongNuBiNan']}
                            onBlur={(e) => validateField('tnldSummary_tongLaoDongNuBiNan', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoNguoiChet || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongSoNguoiChet', val);

                              if (errors['tnldSummary_tongSoNguoiChet']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoNguoiChet']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số người bị chết" />}
                            error={!!errors['tnldSummary_tongSoNguoiChet']}
                            helperText={errors['tnldSummary_tongSoNguoiChet']}
                            onBlur={(e) => validateField('tnldSummary_tongSoNguoiChet', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongSoThuongNang || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('tongSoThuongNang', val);

                              if (errors['tnldSummary_tongSoThuongNang']) setErrors(prev => ({ ...prev, ['tnldSummary_tongSoThuongNang']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số người bị thương nặng" />}
                            error={!!errors['tnldSummary_tongSoThuongNang']}
                            helperText={errors['tnldSummary_tongSoThuongNang']}
                            onBlur={(e) => validateField('tnldSummary_tongSoThuongNang', e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.khongQlNguoiBiNan || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('khongQlNguoiBiNan', val);

                              if (errors['tnldSummary_khongQlNguoiBiNan']) setErrors(prev => ({ ...prev, ['tnldSummary_khongQlNguoiBiNan']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Số người bị nạn không QL" />}
                            error={!!errors['tnldSummary_khongQlNguoiBiNan']}
                            helperText={errors['tnldSummary_khongQlNguoiBiNan']}
                            onBlur={(e) => validateField('tnldSummary_khongQlNguoiBiNan', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.khongQlNuBiNan || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('khongQlNuBiNan', val);

                              if (errors['tnldSummary_khongQlNuBiNan']) setErrors(prev => ({ ...prev, ['tnldSummary_khongQlNuBiNan']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Lao động nữ bị nạn không QL" />}
                            error={!!errors['tnldSummary_khongQlNuBiNan']}
                            helperText={errors['tnldSummary_khongQlNuBiNan']}
                            onBlur={(e) => validateField('tnldSummary_khongQlNuBiNan', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.khongQlNguoiChet || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('khongQlNguoiChet', val);

                              if (errors['tnldSummary_khongQlNguoiChet']) setErrors(prev => ({ ...prev, ['tnldSummary_khongQlNguoiChet']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Số người chết không QL" />}
                            error={!!errors['tnldSummary_khongQlNguoiChet']}
                            helperText={errors['tnldSummary_khongQlNguoiChet']}
                            onBlur={(e) => validateField('tnldSummary_khongQlNguoiChet', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.khongQlThuongNang || ''}
                            onChange={(e) => {

                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleSummaryFieldChange('khongQlThuongNang', val);

                              if (errors['tnldSummary_khongQlThuongNang']) setErrors(prev => ({ ...prev, ['tnldSummary_khongQlThuongNang']: '' }));
                            }}
                            className={classes.field}
                            label={<RequiredLabel text="Người bị thương nặng không QL" />}
                            error={!!errors['tnldSummary_khongQlThuongNang']}
                            helperText={errors['tnldSummary_khongQlThuongNang']}
                            onBlur={(e) => validateField('tnldSummary_khongQlThuongNang', e.target.value)}
                          />
                        </Grid>
                      </Grid>

                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, mt: 4, color: 'text.primary' }}>
                        2. Thiệt hại do tai nạn lao động
                      </Typography>

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={formatNumberWithDots(tnldSummary.chiPhiYTe)}
                            onChange={(e) => updateSummaryCost('chiPhiYTe', e.target.value)}
                            className={classes.field}
                            slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                            label={<RequiredLabel text="Chi phí y tế" />}
                            error={!!errors['tnldSummary_chiPhiYTe']}
                            helperText={errors['tnldSummary_chiPhiYTe']}
                            onBlur={(e) => validateField('tnldSummary_chiPhiYTe', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={formatNumberWithDots(tnldSummary.chiPhiTraLuong)}
                            onChange={(e) => updateSummaryCost('chiPhiTraLuong', e.target.value)}
                            className={classes.field}
                            slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                            label={<RequiredLabel text="Chi phí trả lương trong thời gian điều trị" />}
                            error={!!errors['tnldSummary_chiPhiTraLuong']}
                            helperText={errors['tnldSummary_chiPhiTraLuong']}
                            onBlur={(e) => validateField('tnldSummary_chiPhiTraLuong', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={formatNumberWithDots(tnldSummary.chiPhiBoiThuong)}
                            onChange={(e) => updateSummaryCost('chiPhiBoiThuong', e.target.value)}
                            className={classes.field}
                            slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                            label={<RequiredLabel text="Chi phí bồi thường trợ cấp" />}
                            error={!!errors['tnldSummary_chiPhiBoiThuong']}
                            helperText={errors['tnldSummary_chiPhiBoiThuong']}
                            onBlur={(e) => validateField('tnldSummary_chiPhiBoiThuong', e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            disabled
                            value={formatNumberWithDots(tnldSummary.tongChiPhi)}
                            className={classes.field}
                            slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                            label="Tổng số tiền chi phí"
                            error={!!errors['tnldSummary_tongChiPhi']}
                            helperText={errors['tnldSummary_tongChiPhi']}
                            onBlur={(e) => validateField('tnldSummary_tongChiPhi', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={tnldSummary.tongNgayNghi || ''}
                            onChange={(e) => handleSummaryFieldChange('tongNgayNghi', e.target.value.replace(/[^0-9]/g, ''))}
                            className={classes.field}
                            label={<RequiredLabel text="Tổng số ngày nghỉ vì TNLĐ" />}
                            error={!!errors['tnldSummary_tongNgayNghi']}
                            helperText={errors['tnldSummary_tongNgayNghi']}
                            onBlur={(e) => validateField('tnldSummary_tongNgayNghi', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={formatNumberWithDots(tnldSummary.thietHaiTaiSan)}
                            onChange={(e) => updateSummaryCost('thietHaiTaiSan', e.target.value)}
                            className={classes.field}
                            slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                            label={<RequiredLabel text="Thiệt hại tài sản" />}
                            error={!!errors['tnldSummary_thietHaiTaiSan']}
                            helperText={errors['tnldSummary_thietHaiTaiSan']}
                            onBlur={(e) => validateField('tnldSummary_thietHaiTaiSan', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* STEP 1 - TAB 2: CHI TIẾT TỪNG VỤ */}
                  {tabIndex === 1 && (
                    <Box>
                      {accidentDetails.map((detail, index) => (
                        <Accordion key={index} sx={{ mb: 2, border: '1px solid #e2e8f0', borderRadius: 1.5, boxShadow: 'none' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 600 }}>Chi tiết vụ tai nạn số {index + 1}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                  size="small"
                                  fullWidth
                                  options={CAUSES}
                                  value={CAUSES.find(c => c.id === detail.nguyenNhanId) || null}
                                  onChange={(_, v) => handleDetailFieldChange(index, 'nguyenNhanId', v?.id || '')}
                                  getOptionLabel={(opt) => opt.name}
                                  isOptionEqualToValue={(o, v) => o.id === v.id}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={<RequiredLabel text="1. Phân theo nguyên nhân xảy ra TNLĐ" />}
                                      className={classes.field}
                                      error={!!errors[`accidentDetails_${index}_nguyenNhanId`]}
                                      helperText={errors[`accidentDetails_${index}_nguyenNhanId`]}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                  size="small"
                                  fullWidth
                                  options={injuryFactors}
                                  value={injuryFactors.find((f: any) => f.id === detail.yeuToChanThuongId) || null}
                                  onChange={(_, v) => handleDetailFieldChange(index, 'yeuToChanThuongId', v?.id || '')}
                                  getOptionLabel={(opt: any) => opt.name}
                                  isOptionEqualToValue={(o: any, v: any) => o.id === v.id}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={<RequiredLabel text="2. Phân theo yếu tố gây chấn thương" />}
                                      className={classes.field}
                                      error={!!errors[`accidentDetails_${index}_yeuToChanThuongId`]}
                                      helperText={errors[`accidentDetails_${index}_yeuToChanThuongId`]}
                                    />
                                  )}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Autocomplete
                                  size="small"
                                  fullWidth
                                  options={OCCUPATIONS}
                                  value={OCCUPATIONS.find(o => o.id === detail.ngheNghiepId) || null}
                                  onChange={(_, v) => handleDetailFieldChange(index, 'ngheNghiepId', v?.id || '')}
                                  getOptionLabel={(opt) => opt.name}
                                  isOptionEqualToValue={(o, v) => o.id === v.id}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={<RequiredLabel text="3. Phân theo nghề nghiệp" />}
                                      className={classes.field}
                                      error={!!errors[`accidentDetails_${index}_ngheNghiepId`]}
                                      helperText={errors[`accidentDetails_${index}_ngheNghiepId`]}
                                    />
                                  )}
                                />
                              </Grid>
                            </Grid>

                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                              4. Chi tiết vụ tai nạn số {index + 1}
                            </Typography>

                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.tongSoNguoiBiNan || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'tongSoNguoiBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Tổng số người bị nạn" />}
                                  error={!!errors[`accidentDetails_${index}_tongSoNguoiBiNan`]}
                                  helperText={errors[`accidentDetails_${index}_tongSoNguoiBiNan`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongSoNguoiBiNan`, e.target.value)}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.tongLaoDongNuBiNan || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'tongLaoDongNuBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Tổng số lao động nữ bị nạn" />}
                                  error={!!errors[`accidentDetails_${index}_tongLaoDongNuBiNan`]}
                                  helperText={errors[`accidentDetails_${index}_tongLaoDongNuBiNan`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongLaoDongNuBiNan`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.tongSoNguoiChet || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'tongSoNguoiChet', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Tổng số người bị chết" />}
                                  error={!!errors[`accidentDetails_${index}_tongSoNguoiChet`]}
                                  helperText={errors[`accidentDetails_${index}_tongSoNguoiChet`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongSoNguoiChet`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.tongSoThuongNang || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'tongSoThuongNang', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Tổng số người bị thương nặng" />}
                                  error={!!errors[`accidentDetails_${index}_tongSoThuongNang`]}
                                  helperText={errors[`accidentDetails_${index}_tongSoThuongNang`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongSoThuongNang`, e.target.value)}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.khongQlNguoiBiNan || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'khongQlNguoiBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Số người bị nạn không QL" />}
                                  error={!!errors[`accidentDetails_${index}_khongQlNguoiBiNan`]}
                                  helperText={errors[`accidentDetails_${index}_khongQlNguoiBiNan`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_khongQlNguoiBiNan`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.khongQlNuBiNan || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'khongQlNuBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Lao động nữ bị nạn không QL" />}
                                  error={!!errors[`accidentDetails_${index}_khongQlNuBiNan`]}
                                  helperText={errors[`accidentDetails_${index}_khongQlNuBiNan`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_khongQlNuBiNan`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.khongQlNguoiChet || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'khongQlNguoiChet', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Số người chết không QL" />}
                                  error={!!errors[`accidentDetails_${index}_khongQlNguoiChet`]}
                                  helperText={errors[`accidentDetails_${index}_khongQlNguoiChet`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_khongQlNguoiChet`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.khongQlThuongNang || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'khongQlThuongNang', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Người bị thương nặng không QL" />}
                                  error={!!errors[`accidentDetails_${index}_khongQlThuongNang`]}
                                  helperText={errors[`accidentDetails_${index}_khongQlThuongNang`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_khongQlThuongNang`, e.target.value)}
                                />
                              </Grid>
                            </Grid>

                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                              5. Thiệt hại do tai nạn lao động số {index + 1}
                            </Typography>

                            <Grid container spacing={3}>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={formatNumberWithDots(detail.stats.chiPhiYTe)}
                                  onChange={(e) => updateDetailCost(index, 'chiPhiYTe', e.target.value)}
                                  className={classes.field}
                                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                                  label={<RequiredLabel text="Chi phí y tế" />}
                                  error={!!errors[`accidentDetails_${index}_chiPhiYTe`]}
                                  helperText={errors[`accidentDetails_${index}_chiPhiYTe`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_chiPhiYTe`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={formatNumberWithDots(detail.stats.chiPhiTraLuong)}
                                  onChange={(e) => updateDetailCost(index, 'chiPhiTraLuong', e.target.value)}
                                  className={classes.field}
                                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                                  label={<RequiredLabel text="Chi phí trả lương trong thời gian điều trị" />}
                                  error={!!errors[`accidentDetails_${index}_chiPhiTraLuong`]}
                                  helperText={errors[`accidentDetails_${index}_chiPhiTraLuong`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_chiPhiTraLuong`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={formatNumberWithDots(detail.stats.chiPhiBoiThuong)}
                                  onChange={(e) => updateDetailCost(index, 'chiPhiBoiThuong', e.target.value)}
                                  className={classes.field}
                                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                                  label={<RequiredLabel text="Chi phí bồi thường trợ cấp" />}
                                  error={!!errors[`accidentDetails_${index}_chiPhiBoiThuong`]}
                                  helperText={errors[`accidentDetails_${index}_chiPhiBoiThuong`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_chiPhiBoiThuong`, e.target.value)}
                                />
                              </Grid>

                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  disabled
                                  value={formatNumberWithDots(detail.stats.tongChiPhi)}
                                  className={classes.field}
                                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                                  label="Tổng số tiền chi phí"
                                  error={!!errors[`accidentDetails_${index}_tongChiPhi`]}
                                  helperText={errors[`accidentDetails_${index}_tongChiPhi`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongChiPhi`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={detail.stats.tongNgayNghi || ''}
                                  onChange={(e) => handleDetailFieldChange(index, 'tongNgayNghi', e.target.value.replace(/[^0-9]/g, ''), true)}
                                  className={classes.field}
                                  label={<RequiredLabel text="Tổng số ngày nghỉ vì TNLĐ" />}
                                  error={!!errors[`accidentDetails_${index}_tongNgayNghi`]}
                                  helperText={errors[`accidentDetails_${index}_tongNgayNghi`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_tongNgayNghi`, e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={formatNumberWithDots(detail.stats.thietHaiTaiSan)}
                                  onChange={(e) => updateDetailCost(index, 'thietHaiTaiSan', e.target.value)}
                                  className={classes.field}
                                  slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                                  label={<RequiredLabel text="Thiệt hại tài sản" />}
                                  error={!!errors[`accidentDetails_${index}_thietHaiTaiSan`]}
                                  helperText={errors[`accidentDetails_${index}_thietHaiTaiSan`]}
                                  onBlur={(e) => validateField(`accidentDetails_${index}_thietHaiTaiSan`, e.target.value)}
                                />
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* STEP 2: 2. TAI NẠN LAO ĐỘNG HƯỞNG TRỢ CẤP */}
              {step === 2 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                    1. Tổng số vụ tai nạn lao động & số nạn nhân tai nạn lao động
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoVu || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoVu', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số vụ" />}
                        error={!!errors['tnldTroCapSummary_tongSoVu']}
                        helperText={errors['tnldTroCapSummary_tongSoVu']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoVu', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoVuNguoiChet || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoVuNguoiChet', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số vụ có người chết" />}
                        error={!!errors['tnldTroCapSummary_tongSoVuNguoiChet']}
                        helperText={errors['tnldTroCapSummary_tongSoVuNguoiChet']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoVuNguoiChet', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoVu2Nguoi || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoVu2Nguoi', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số vụ có 2 người bị nạn trở lên" />}
                        error={!!errors['tnldTroCapSummary_tongSoVu2Nguoi']}
                        helperText={errors['tnldTroCapSummary_tongSoVu2Nguoi']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoVu2Nguoi', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }} />
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoNguoiBiNan || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoNguoiBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số người bị nạn" />}
                        error={!!errors['tnldTroCapSummary_tongSoNguoiBiNan']}
                        helperText={errors['tnldTroCapSummary_tongSoNguoiBiNan']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoNguoiBiNan', e.target.value)}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongLaoDongNuBiNan || ''}
                        onChange={(e) => handleSummaryFieldChange('tongLaoDongNuBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số lao động nữ bị nạn" />}
                        error={!!errors['tnldTroCapSummary_tongLaoDongNuBiNan']}
                        helperText={errors['tnldTroCapSummary_tongLaoDongNuBiNan']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongLaoDongNuBiNan', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoNguoiChet || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoNguoiChet', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số người bị chết" />}
                        error={!!errors['tnldTroCapSummary_tongSoNguoiChet']}
                        helperText={errors['tnldTroCapSummary_tongSoNguoiChet']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoNguoiChet', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongSoThuongNang || ''}
                        onChange={(e) => handleSummaryFieldChange('tongSoThuongNang', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số người bị thương nặng" />}
                        error={!!errors['tnldTroCapSummary_tongSoThuongNang']}
                        helperText={errors['tnldTroCapSummary_tongSoThuongNang']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongSoThuongNang', e.target.value)}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.khongQlNguoiBiNan || ''}
                        onChange={(e) => handleSummaryFieldChange('khongQlNguoiBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Số người bị nạn không QL" />}
                        error={!!errors['tnldTroCapSummary_khongQlNguoiBiNan']}
                        helperText={errors['tnldTroCapSummary_khongQlNguoiBiNan']}
                        onBlur={(e) => validateField('tnldTroCapSummary_khongQlNguoiBiNan', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.khongQlNuBiNan || ''}
                        onChange={(e) => handleSummaryFieldChange('khongQlNuBiNan', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Lao động nữ bị nạn không QL" />}
                        error={!!errors['tnldTroCapSummary_khongQlNuBiNan']}
                        helperText={errors['tnldTroCapSummary_khongQlNuBiNan']}
                        onBlur={(e) => validateField('tnldTroCapSummary_khongQlNuBiNan', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.khongQlNguoiChet || ''}
                        onChange={(e) => handleSummaryFieldChange('khongQlNguoiChet', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Số người chết không QL" />}
                        error={!!errors['tnldTroCapSummary_khongQlNguoiChet']}
                        helperText={errors['tnldTroCapSummary_khongQlNguoiChet']}
                        onBlur={(e) => validateField('tnldTroCapSummary_khongQlNguoiChet', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.khongQlThuongNang || ''}
                        onChange={(e) => handleSummaryFieldChange('khongQlThuongNang', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Người bị thương nặng không QL" />}
                        error={!!errors['tnldTroCapSummary_khongQlThuongNang']}
                        helperText={errors['tnldTroCapSummary_khongQlThuongNang']}
                        onBlur={(e) => validateField('tnldTroCapSummary_khongQlThuongNang', e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, mt: 4, color: 'text.primary' }}>
                    2. Thiệt hại do tai nạn lao động
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={formatNumberWithDots(tnldTroCapSummary.chiPhiYTe)}
                        onChange={(e) => updateSummaryCost('chiPhiYTe', e.target.value, true)}
                        className={classes.field}
                        slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                        label={<RequiredLabel text="Chi phí y tế" />}
                        error={!!errors['tnldTroCapSummary_chiPhiYTe']}
                        helperText={errors['tnldTroCapSummary_chiPhiYTe']}
                        onBlur={(e) => validateField('tnldTroCapSummary_chiPhiYTe', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={formatNumberWithDots(tnldTroCapSummary.chiPhiTraLuong)}
                        onChange={(e) => updateSummaryCost('chiPhiTraLuong', e.target.value, true)}
                        className={classes.field}
                        slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                        label={<RequiredLabel text="Chi phí trả lương trong thời gian điều trị" />}
                        error={!!errors['tnldTroCapSummary_chiPhiTraLuong']}
                        helperText={errors['tnldTroCapSummary_chiPhiTraLuong']}
                        onBlur={(e) => validateField('tnldTroCapSummary_chiPhiTraLuong', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={formatNumberWithDots(tnldTroCapSummary.chiPhiBoiThuong)}
                        onChange={(e) => updateSummaryCost('chiPhiBoiThuong', e.target.value, true)}
                        className={classes.field}
                        slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                        label={<RequiredLabel text="Chi phí bồi thường trợ cấp" />}
                        error={!!errors['tnldTroCapSummary_chiPhiBoiThuong']}
                        helperText={errors['tnldTroCapSummary_chiPhiBoiThuong']}
                        onBlur={(e) => validateField('tnldTroCapSummary_chiPhiBoiThuong', e.target.value)}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        disabled
                        value={formatNumberWithDots(tnldTroCapSummary.tongChiPhi)}
                        className={classes.field}
                        slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                        label="Tổng số tiền chi phí"
                        error={!!errors['tnldTroCapSummary_tongChiPhi']}
                        helperText={errors['tnldTroCapSummary_tongChiPhi']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongChiPhi', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tnldTroCapSummary.tongNgayNghi || ''}
                        onChange={(e) => handleSummaryFieldChange('tongNgayNghi', e.target.value.replace(/[^0-9]/g, ''), true)}
                        className={classes.field}
                        label={<RequiredLabel text="Tổng số ngày nghỉ vì TNLĐ" />}
                        error={!!errors['tnldTroCapSummary_tongNgayNghi']}
                        helperText={errors['tnldTroCapSummary_tongNgayNghi']}
                        onBlur={(e) => validateField('tnldTroCapSummary_tongNgayNghi', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={formatNumberWithDots(tnldTroCapSummary.thietHaiTaiSan)}
                        onChange={(e) => updateSummaryCost('thietHaiTaiSan', e.target.value, true)}
                        className={classes.field}
                        slotProps={{ input: { endAdornment: <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>(1.000đ)</Typography> } }}
                        label={<RequiredLabel text="Thiệt hại tài sản" />}
                        error={!!errors['tnldTroCapSummary_thietHaiTaiSan']}
                        helperText={errors['tnldTroCapSummary_thietHaiTaiSan']}
                        onBlur={(e) => validateField('tnldTroCapSummary_thietHaiTaiSan', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STEP 3: PREVIEW AND SUBMIT REPORT */}
              {step === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm {selectedYear}
                  </Typography>

                  {/* Upload document stamp */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1.5, p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ color: 'red', fontWeight: 'bold' }}>**</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                      Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty:
                    </Typography>

                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{ textTransform: 'none', borderRadius: 1.5 }}
                    >
                      Tại đây
                      <input
                        type="file"
                        hidden
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                      />
                    </Button>

                    {uploadingFile ? (
                      <CircularProgress size={20} />
                    ) : reportFileUrl ? (
                      <MuiLink
                        href={getAbsoluteFileUrl(reportFileUrl)}
                        target="_blank"
                        underline="always"
                        sx={{ ml: 1, fontWeight: 500, color: 'primary.main' }}
                      >
                        {reportFileName || reportFileUrl.split('/').pop() || 'Tệp đính kèm'}
                      </MuiLink>
                    ) : (
                      <Typography sx={{ ml: 1, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.85rem' }}>
                        (Chưa tải tệp đính kèm lên)
                      </Typography>
                    )}
                  </Box>

                  {/* Complete static preview report layout */}
                  <Box ref={printComponentRef} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #cbd5e1', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm {selectedYear}
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #cbd5e1' }}>
                      <Table size="small" sx={{ minWidth: 1000 }}>
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
                            <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                            <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                            <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                            <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                            <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                            <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                            <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                            <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {/* Section 1 */}
                          <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', ...cellStyle }}>1. Tai nạn lao động</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 3, ...cellStyle }}>Tai nạn lao động</TableCell>
                            <TableCell align="center" sx={cellStyle}>-</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVu}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVuNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVu2Nguoi}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongLaoDongNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoThuongNang}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlThuongNang}</TableCell>
                          </TableRow>

                          {/* Causes classification */}
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.1 Phân theo nguyên nhân xảy ra TNLĐ</TableCell>
                          </TableRow>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={13} sx={{ fontStyle: 'italic', pl: 4, ...cellStyle }}>a. Do người sử dụng lao động</TableCell>
                          </TableRow>
                          {(() => {
                            const matched = CAUSES.slice(0, 6).map((c, i) => {
                              const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === c.id);
                              if (matches.length === 0) return null;
                              return { c, code: i + 1, stats: aggregateStats(matches) };
                            }).filter(Boolean) as any[];
                            return matched.map(({ c, code, stats }) => (
                              <TableRow key={c.id}>
                                <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{code}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                              </TableRow>
                            ));
                          })()}

                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={13} sx={{ fontStyle: 'italic', pl: 4, ...cellStyle }}>b. Do người lao động</TableCell>
                          </TableRow>
                          {(() => {
                            const matched = CAUSES.slice(6, 8).map((c, i) => {
                              const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === c.id);
                              if (matches.length === 0) return null;
                              return { c, code: i + 7, stats: aggregateStats(matches) };
                            }).filter(Boolean) as any[];
                            return matched.map(({ c, code, stats }) => (
                              <TableRow key={c.id}>
                                <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{code}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                              </TableRow>
                            ));
                          })()}

                          {(() => {
                            const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === 9);
                            if (matches.length === 0) return null;
                            const stats = aggregateStats(matches);
                            const c = CAUSES[8];
                            return (
                              <TableRow key={c.id}>
                                <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                                <TableCell align="center" sx={cellStyle}>9</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                                <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                              </TableRow>
                            );
                          })()}

                          {/* Injury factor classification */}
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.2 Phân theo yếu tố gây chấn thương</TableCell>
                          </TableRow>
                          {(() => {
                            const uniqueYeuToIds = Array.from(new Set(accidentDetails.map(d => Number(d.yeuToChanThuongId)).filter(Boolean)));
                            return uniqueYeuToIds.map((factorId) => {
                              const matches = accidentDetails.filter(d => Number(d.yeuToChanThuongId) === factorId);
                              const stats = aggregateStats(matches);
                              const factorInfo = injuryFactors.find((f: any) => f.id === factorId);
                              const name = factorInfo?.name || `Yếu tố ${factorId}`;
                              return (
                                <TableRow key={factorId}>
                                  <TableCell sx={{ pl: 4, ...cellStyle }}>{name}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{factorId}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                                </TableRow>
                              );
                            });
                          })()}

                          {/* Occupation classification */}
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.3 Phân theo nghề nghiệp</TableCell>
                          </TableRow>
                          {(() => {
                            const uniqueNgheNghiepIds = Array.from(new Set(accidentDetails.map(d => Number(d.ngheNghiepId)).filter(Boolean)));
                            return uniqueNgheNghiepIds.map((occId) => {
                              const matches = accidentDetails.filter(d => Number(d.ngheNghiepId) === occId);
                              const stats = aggregateStats(matches);
                              const occInfo = OCCUPATIONS.find(o => o.id === occId);
                              const name = occInfo?.name || `Nghề nghiệp ${occId}`;
                              return (
                                <TableRow key={occId}>
                                  <TableCell sx={{ pl: 4, ...cellStyle }}>{name}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{occId}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                                  <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                                </TableRow>
                              );
                            });
                          })()}

                          {/* Section 2: Subsidies */}
                          <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', ...cellStyle }}>2. Tai nạn lao động được hưởng trợ cấp theo quy định tại khoản 2 Điều 39 Luật ATVSLĐ</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ pl: 3, ...cellStyle }}>Tai nạn được hưởng trợ cấp</TableCell>
                            <TableCell align="center" sx={cellStyle}>10</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVu}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVuNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVu2Nguoi}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongLaoDongNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoThuongNang}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlThuongNang}</TableCell>
                          </TableRow>

                          {/* Section 3: Totals */}
                          <TableRow sx={{ bgcolor: '#e2e8f0', fontWeight: 'bold' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', ...cellStyle }}>3. Tổng số (3=1+2)</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVu) + Number(tnldTroCapSummary.tongSoVu)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVuNguoiChet) + Number(tnldTroCapSummary.tongSoVuNguoiChet)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVu2Nguoi) + Number(tnldTroCapSummary.tongSoVu2Nguoi)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoNguoiBiNan) + Number(tnldTroCapSummary.tongSoNguoiBiNan)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNguoiBiNan) + Number(tnldTroCapSummary.khongQlNguoiBiNan)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongLaoDongNuBiNan) + Number(tnldTroCapSummary.tongLaoDongNuBiNan)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNuBiNan) + Number(tnldTroCapSummary.khongQlNuBiNan)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoNguoiChet) + Number(tnldTroCapSummary.tongSoNguoiChet)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNguoiChet) + Number(tnldTroCapSummary.khongQlNguoiChet)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoThuongNang) + Number(tnldTroCapSummary.tongSoThuongNang)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlThuongNang) + Number(tnldTroCapSummary.khongQlThuongNang)}</TableCell>
                          </TableRow>

                          {/* Damage Costs Table Section */}
                          <TableRow sx={{ bgcolor: '#cbd5e1' }}>
                            <TableCell colSpan={13} sx={{ fontWeight: 'bold', fontSize: '0.9rem', ...cellStyle }}>II. Thiệt hại do tai nạn lao động</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={3} sx={headStyle} align="center">Tổng số ngày nghỉ vì TNLĐ</TableCell>
                            <TableCell colSpan={7} sx={headStyle} align="center">Tổng chi phí do TNLĐ (1.000đ)</TableCell>
                            <TableCell colSpan={3} sx={headStyle} align="center">Thiệt hại tài sản (1.000đ)</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={cellStyle}>{tnldSummary.tongNgayNghi}</TableCell>
                            <TableCell colSpan={1} align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{formatNumberWithDots(tnldSummary.tongChiPhi)}</TableCell>
                            <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiYTe)}</TableCell>
                            <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiTraLuong)}</TableCell>
                            <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiBoiThuong)}</TableCell>
                            <TableCell colSpan={3} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.thietHaiTaiSan)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Cancel Wizard Dialogue Popup Alert */}
          <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 'bold', py: 1.5 }}>
              Cảnh báo
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography>Dữ liệu báo cáo đã nhập sẽ không được lưu lại</Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setCancelDialogOpen(false)} variant="text" sx={{ color: 'text.secondary', textTransform: 'none' }}>
                Hủy bỏ
              </Button>
              <Button
                onClick={() => { setCancelDialogOpen(false); setMode('list'); }}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  bgcolor: '#2f65f0',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0px 4px 12px rgba(47, 101, 240, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: '#1e4fd1',
                    boxShadow: '0px 8px 20px rgba(47, 101, 240, 0.35)',
                  }
                }}
              >
                Đồng ý
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* -------------------- 3. REVIEW ONLY SCREEN (mode === 'view') -------------------- */}
      {mode === 'view' && (
        <>
          <Box className={classes.pageHeader}>
            <Typography className={classes.headerTitle}>
              Báo cáo định kỳ Tai nạn lao động
            </Typography>
            <Box className={classes.actions}>
              <Button
                onClick={() => setMode('list')}
                sx={{
                  textTransform: 'none',
                  color: '#666',
                  bgcolor: '#fff',
                  border: 'none',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  padding: '4.8px 18px',
                  boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#f5f5f7',
                    color: '#333',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)',
                  },
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="outlined"
                sx={{ color: '#2f65f0', borderColor: '#cfd9f3', borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                startIcon={<PrintIcon />}
                onClick={triggerPrint}
              >
                In báo cáo
              </Button>
            </Box>
          </Box>

          <Box className={classes.mainContent}>
            <Box className={classes.card} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm {selectedYear}
              </Typography>

              {/* Company stamp file view */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1 }}>
                <Typography sx={{ color: 'red', fontWeight: 'bold' }}>**</Typography>
                <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                  Vui lòng đính kèm báo cáo TNLĐ có dấu mộc công ty:
                </Typography>
                {reportFileUrl ? (
                  <MuiLink
                    href={getAbsoluteFileUrl(reportFileUrl)}
                    target="_blank"
                    underline="always"
                    sx={{ ml: 1, fontWeight: 500, color: 'primary.main' }}
                  >
                    {reportFileName || reportFileUrl.split('/').pop() || 'Tệp đính kèm'}
                  </MuiLink>
                ) : (
                  <Typography sx={{ ml: 1, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.85rem' }}>
                    (Không có tệp đính kèm)
                  </Typography>
                )}
              </Box>

              {/* Complete static review preview table */}
              <Box ref={printComponentRef} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #cbd5e1', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Báo cáo tổng hợp tình hình tai nạn lao động - Kỳ báo cáo: {period === 'CA_NAM' ? 'Cả năm' : '6 tháng'} năm {selectedYear}
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #cbd5e1' }}>
                  <Table size="small" sx={{ minWidth: 1000 }}>
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
                        <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                        <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                        <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                        <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                        <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                        <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                        <TableCell align="center" sx={headStyle}>Tổng số</TableCell>
                        <TableCell align="center" sx={headStyle}>NN không thuộc quyền quản lý</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Section 1 */}
                      <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', ...cellStyle }}>1. Tai nạn lao động</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3, ...cellStyle }}>Tai nạn lao động</TableCell>
                        <TableCell align="center" sx={cellStyle}>-</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVu}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVuNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoVu2Nguoi}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoNguoiBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNguoiBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongLaoDongNuBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNuBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.tongSoThuongNang}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldSummary.khongQlThuongNang}</TableCell>
                      </TableRow>

                      {/* Causes classification */}
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.1 Phân theo nguyên nhân xảy ra TNLĐ</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={13} sx={{ fontStyle: 'italic', pl: 4, ...cellStyle }}>a. Do người sử dụng lao động</TableCell>
                      </TableRow>
                      {(() => {
                        const matched = CAUSES.slice(0, 6).map((c, i) => {
                          const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === c.id);
                          if (matches.length === 0) return null;
                          return { c, code: i + 1, stats: aggregateStats(matches) };
                        }).filter(Boolean) as any[];
                        return matched.map(({ c, code, stats }) => (
                          <TableRow key={c.id}>
                            <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{code}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                          </TableRow>
                        ));
                      })()}

                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={13} sx={{ fontStyle: 'italic', pl: 4, ...cellStyle }}>b. Do người lao động</TableCell>
                      </TableRow>
                      {(() => {
                        const matched = CAUSES.slice(6, 8).map((c, i) => {
                          const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === c.id);
                          if (matches.length === 0) return null;
                          return { c, code: i + 7, stats: aggregateStats(matches) };
                        }).filter(Boolean) as any[];
                        return matched.map(({ c, code, stats }) => (
                          <TableRow key={c.id}>
                            <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{code}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                          </TableRow>
                        ));
                      })()}

                      {(() => {
                        const matches = accidentDetails.filter(d => Number(d.nguyenNhanId) === 9);
                        if (matches.length === 0) return null;
                        const stats = aggregateStats(matches);
                        const c = CAUSES[8];
                        return (
                          <TableRow key={c.id}>
                            <TableCell sx={{ pl: 5, ...cellStyle }}>{c.name}</TableCell>
                            <TableCell align="center" sx={cellStyle}>9</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                            <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                          </TableRow>
                        );
                      })()}

                      {/* Injury factor classification */}
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.2 Phân theo yếu tố gây chấn thương</TableCell>
                      </TableRow>
                      {(() => {
                        const uniqueYeuToIds = Array.from(new Set(accidentDetails.map(d => Number(d.yeuToChanThuongId)).filter(Boolean)));
                        return uniqueYeuToIds.map((factorId) => {
                          const matches = accidentDetails.filter(d => Number(d.yeuToChanThuongId) === factorId);
                          const stats = aggregateStats(matches);
                          const factorInfo = injuryFactors.find((f: any) => f.id === factorId);
                          const name = factorInfo?.name || `Yếu tố ${factorId}`;
                          return (
                            <TableRow key={factorId}>
                              <TableCell sx={{ pl: 4, ...cellStyle }}>{name}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{factorId}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}

                      {/* Occupation classification */}
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', pl: 3, ...cellStyle }}>1.3 Phân theo nghề nghiệp</TableCell>
                      </TableRow>
                      {(() => {
                        const uniqueNgheNghiepIds = Array.from(new Set(accidentDetails.map(d => Number(d.ngheNghiepId)).filter(Boolean)));
                        return uniqueNgheNghiepIds.map((occId) => {
                          const matches = accidentDetails.filter(d => Number(d.ngheNghiepId) === occId);
                          const stats = aggregateStats(matches);
                          const occInfo = OCCUPATIONS.find(o => o.id === occId);
                          const name = occInfo?.name || `Nghề nghiệp ${occId}`;
                          return (
                            <TableRow key={occId}>
                              <TableCell sx={{ pl: 4, ...cellStyle }}>{name}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{occId}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVu}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVuNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoVu2Nguoi}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongLaoDongNuBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNuBiNan}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlNguoiChet}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.tongSoThuongNang}</TableCell>
                              <TableCell align="center" sx={cellStyle}>{stats.khongQlThuongNang}</TableCell>
                            </TableRow>
                          );
                        });
                      })()}

                      {/* Section 2: Subsidies */}
                      <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', ...cellStyle }}>2. Tai nạn lao động được hưởng trợ cấp theo quy định tại khoản 2 Điều 39 Luật ATVSLĐ</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 3, ...cellStyle }}>Tai nạn được hưởng trợ cấp</TableCell>
                        <TableCell align="center" sx={cellStyle}>10</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVu}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVuNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoVu2Nguoi}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoNguoiBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNguoiBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongLaoDongNuBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNuBiNan}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlNguoiChet}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.tongSoThuongNang}</TableCell>
                        <TableCell align="center" sx={cellStyle}>{tnldTroCapSummary.khongQlThuongNang}</TableCell>
                      </TableRow>

                      {/* Section 3: Totals */}
                      <TableRow sx={{ bgcolor: '#e2e8f0', fontWeight: 'bold' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 'bold', ...cellStyle }}>3. Tổng số (3=1+2)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVu) + Number(tnldTroCapSummary.tongSoVu)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVuNguoiChet) + Number(tnldTroCapSummary.tongSoVuNguoiChet)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoVu2Nguoi) + Number(tnldTroCapSummary.tongSoVu2Nguoi)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoNguoiBiNan) + Number(tnldTroCapSummary.tongSoNguoiBiNan)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNguoiBiNan) + Number(tnldTroCapSummary.khongQlNguoiBiNan)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongLaoDongNuBiNan) + Number(tnldTroCapSummary.tongLaoDongNuBiNan)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNuBiNan) + Number(tnldTroCapSummary.khongQlNuBiNan)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoNguoiChet) + Number(tnldTroCapSummary.tongSoNguoiChet)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlNguoiChet) + Number(tnldTroCapSummary.khongQlNguoiChet)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.tongSoThuongNang) + Number(tnldTroCapSummary.tongSoThuongNang)}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{Number(tnldSummary.khongQlThuongNang) + Number(tnldTroCapSummary.khongQlThuongNang)}</TableCell>
                      </TableRow>

                      {/* Damage Costs Table Section */}
                      <TableRow sx={{ bgcolor: '#cbd5e1' }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 'bold', fontSize: '0.9rem', ...cellStyle }}>II. Thiệt hại do tai nạn lao động</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} sx={headStyle} align="center">Tổng số ngày nghỉ vì TNLĐ</TableCell>
                        <TableCell colSpan={7} sx={headStyle} align="center">Tổng chi phí do TNLĐ (1.000đ)</TableCell>
                        <TableCell colSpan={3} sx={headStyle} align="center">Thiệt hại tài sản (1.000đ)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={cellStyle}>{tnldSummary.tongNgayNghi}</TableCell>
                        <TableCell colSpan={1} align="center" sx={{ fontWeight: 'bold', ...cellStyle }}>{formatNumberWithDots(tnldSummary.tongChiPhi)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiYTe)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiTraLuong)}</TableCell>
                        <TableCell colSpan={2} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.chiPhiBoiThuong)}</TableCell>
                        <TableCell colSpan={3} align="center" sx={cellStyle}>{formatNumberWithDots(tnldSummary.thietHaiTaiSan)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Dialog showing rejection reason */}
      <Dialog
        open={rejectReasonDialogOpen}
        onClose={() => setRejectReasonDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 'bold', py: 1.5 }}>
          Lý do hủy tiếp nhận
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>{currentRejectReason || 'Không có lý do cụ thể.'}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRejectReasonDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: '#ef4444',
              color: '#fff',
              textTransform: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0px 4px 12px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#dc2626',
                boxShadow: '0px 8px 20px rgba(239, 68, 68, 0.35)'
              }
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
