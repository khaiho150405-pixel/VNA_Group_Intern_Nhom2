'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  Tooltip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Collapse,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  KeyboardArrowRight as ChevronRightIcon,
  DoneAll as DoneAllIcon,
  Visibility as ViewIcon,
  Visibility,
  VisibilityOff,
  Event as EventIcon,
  ErrorOutlined as ErrorOutlinedIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { CustomCalendar } from '@core/components/CustomCalendar';
import { DoetService } from '@tts/services';
import { authService } from '@tts/services/auth.services';
import {
  Doet,
  LoaiHinhKinhDoanh,
  BusinessLine,
  KeyValue,
  FileAttachment,
} from '@shared/tts/models';

import { EnterpriseAttachmentsTable } from './EnterpriseAttachmentsTable';
import { FilePreviewDialog } from './FilePreviewDialog';
import { useEnterpriseFormStyles } from '../logic/enterprise/form-style';

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_ATTACHMENTS: FileAttachment[] = [
  { type: 'GPKD', fileName: '', fileUrl: '' },
  { type: 'OTHER', fileName: '', fileUrl: '' },
];

const normalizeListResponse = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.items)) return raw.data.items;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
};

const getRegisterErrorMessage = (error: any, defaultMsg: string): string | string[] => {
  const backendMsg = error?.response?.data?.errors || error?.response?.data?.message || error?.message || '';
  if (!backendMsg) return defaultMsg;
  if (typeof backendMsg === 'string') {
    if (backendMsg === 'BAD REQUEST' || backendMsg.toUpperCase() === 'BAD REQUEST') return defaultMsg;
    return backendMsg;
  }
  if (Array.isArray(backendMsg)) {
    return backendMsg;
  }
  if (typeof backendMsg === 'object') {
    const nested = backendMsg.message || backendMsg.error;
    if (nested) {
      if (Array.isArray(nested)) return nested;
      if (typeof nested === 'string' && nested !== 'BAD REQUEST') return nested;
    }
  }
  return defaultMsg;
};


const formatDateInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateDisplay = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const dd = `${date.getDate()}`.padStart(2, '0');
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

import { validate, VALIDATION_MESSAGES } from '@core/utils/validation';
import { VNA_COLORS } from '@core/theme';

const isValidEmail = (email: string) => validate.email(email);
const isValidTaxCode = (taxCode: string) => validate.taxCode(taxCode);

const RequiredLabel = ({ text }: { text: string }) => (
  <span>{text} <span style={{ color: '#ef4444' }}>*</span></span>
);

const StepDot = styled('div')<{ ownerState: { active?: boolean; completed?: boolean } }>(
  ({ ownerState }) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 600,
    backgroundColor: ownerState.active || ownerState.completed ? '#2f65f0' : '#e3e7ef',
    color: ownerState.active || ownerState.completed ? '#fff' : '#9aa3b3',
    transition: 'all 0.2s',
  }),
);

const renderStepIcon = (props: { active?: boolean; completed?: boolean; icon: React.ReactNode }) => {
  const { active, completed, icon } = props;
  if (completed) {
    return (
      <StepDot ownerState={{ active, completed }}>
        <DoneAllIcon sx={{ fontSize: 16 }} />
      </StepDot>
    );
  }
  return <StepDot ownerState={{ active, completed }}>{icon}</StepDot>;
};

const CustomStepIcon = (props: any) => renderStepIcon(props);

export const RegisterDialog = ({ open, onClose }: RegisterDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const classes = useEnterpriseFormStyles();

  // step: 0: Form, 1: OTP, 2: Confirm, 3: Success
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Doet> & { loaiHinhId?: number; businessLineId?: number; }>({
    name: '',
    name2: '',
    taxCode: '',
    email: '',
    address: '',
    officePhone: '',
    operatingAddress: '',
    headOfEnterprise: '',
    headPhone: '',
    status: 'ACTIVE',
    attachments: DEFAULT_ATTACHMENTS,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Auto-dismiss OTP messages after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpError || otpSuccess) {
      if (otpSuccess !== 'Đang gửi mã OTP...' && otpSuccess !== 'Đang gửi lại mã OTP...') {
        timer = setTimeout(() => {
          setOtpError('');
          setOtpSuccess('');
        }, 3000);
      }
    }
    return () => clearTimeout(timer);
  }, [otpError, otpSuccess]);

  const [loaiHinhs, setLoaiHinhs] = useState<LoaiHinhKinhDoanh[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regWards, setRegWards] = useState<any[]>([]);
  const [opWards, setOpWards] = useState<any[]>([]);

  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);
  const [dateInput, setDateInput] = useState('');

  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [showSuccessPassword, setShowSuccessPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setOtp('');
      setOtpError('');
      setOtpSuccess('');
      setShowSuccessPassword(false);
      setFormData({
        name: '',
        name2: '',
        taxCode: '',
        email: '',
        address: '',
        officePhone: '',
        operatingAddress: '',
        headOfEnterprise: '',
        headPhone: '',
        status: 'ACTIVE',
        attachments: DEFAULT_ATTACHMENTS,
      });
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    setDateInput(formatDateDisplay(formData.gpkdDate));
  }, [formData.gpkdDate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 1 && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const filtered = val.replace(/[^0-9/]/g, '');
    setDateInput(filtered);
    const reg = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = filtered.match(reg);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const y = parseInt(match[3], 10);
      if (y > 1900 && y < 2100 && m >= 0 && m < 12 && d > 0 && d <= 31) {
        const date = new Date(y, m, d);
        if (!isNaN(date.getTime())) {
          setField('gpkdDate', date);
        }
      }
    } else if (filtered === '') {
      setField('gpkdDate', null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const [lh, bl, prov] = await Promise.all([
          authService.getPublicLoaiHinhKinhDoanh(),
          authService.getPublicBusinessLines(),
          DoetService.getProvinces(),
        ]);
        if (cancelled) return;
        setLoaiHinhs(normalizeListResponse(lh));
        setBusinessLines(normalizeListResponse(bl));
        setProvinces(normalizeListResponse(prov));
      } catch (error) {
        if (!cancelled) enqueueSnackbar('Lỗi khi tải danh mục', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (open) init();
    return () => { cancelled = true; };
  }, [open]);

  const setField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleProvinceChange = async (option: any) => {
    if (!option) {
      setField('province', undefined);
      setField('ward', undefined);
      setField('address', '');
      setRegWards([]);
      return;
    }
    const kv: KeyValue = { key: option.id, value: option.full_name || option.name || '' };
    setField('province', kv);
    setField('ward', undefined);
    setField('address', '');
    try {
      const res = await DoetService.getDistricts(String(option.id));
      setRegWards(normalizeListResponse(res));
    } catch (e) {
      setRegWards([]);
    }
  };

  const handleOpProvinceChange = async (option: any) => {
    if (!option) {
      setField('operatingProvince', undefined);
      setField('operatingWard', undefined);
      setOpWards([]);
      return;
    }
    const kv: KeyValue = { key: option.id, value: option.full_name || option.name || '' };
    setField('operatingProvince', kv);
    setField('operatingWard', undefined);
    try {
      const res = await DoetService.getDistricts(String(option.id));
      setOpWards(normalizeListResponse(res));
    } catch (e) {
      setOpWards([]);
    }
  };

  const handleWardChange = (type: 'reg' | 'op', option: any) => {
    const kv: KeyValue | undefined = option ? { key: option.id, value: option.full_name || option.name || '' } : undefined;
    if (type === 'reg') {
      setField('ward', kv);
      if (!kv) setField('address', '');
    } else {
      setField('operatingWard', kv);
    }
  };

  const handleEmailBlur = async () => {
    const email = (formData.email || '').trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Email không hợp lệ , vui lòng kiểm tra lại dữ liệu' }));
      return;
    }
    try {
      const res: any = await authService.checkEmailPublic(email);
      const exists = res?.existed ?? res?.data?.existed ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, email: 'Email mới đã tồn tại trên hệ thống, vui lòng kiểm tra lại dữ liệu' }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    } catch (error) {
      // ignore
    }
  };

  const handleTaxCodeBlur = async () => {
    const taxCode = (formData.taxCode || '').trim();
    if (!taxCode) return;
    if (!isValidTaxCode(taxCode)) {
      setErrors((prev) => ({ ...prev, taxCode: 'Mã số thuế không hợp lệ (Gồm 10 đến 20 số, nếu có 13 số thì bắt buộc dùng dấu gạch ngang phân tách 3 số cuối, VD: 0101234567-001)' }));
      return;
    }
    try {
      const res: any = await DoetService.checkTaxCode(taxCode);
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, taxCode: 'Mã số thuế này đã tồn tại trong hệ thống' }));
      } else {
        setErrors((prev) => ({ ...prev, taxCode: '' }));
      }
    } catch (error) { }
  };

  const handleNameBlur = async () => {
    const name = (formData.name || '').trim();
    if (!name) return;
    try {
      const res: any = await DoetService.checkName(name);
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, name: 'Tên doanh nghiệp này đã tồn tại trong hệ thống' }));
      } else {
        setErrors((prev) => ({ ...prev, name: '' }));
      }
    } catch (error) { }
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errs.name = 'Tên doanh nghiệp không được để trống';
    } else if (errors.name) {
      errs.name = errors.name;
    }

    if (!formData.taxCode?.trim()) {
      errs.taxCode = 'Mã số thuế không được để trống';
    } else if (!isValidTaxCode(formData.taxCode)) {
      errs.taxCode = 'Mã số thuế không hợp lệ (Gồm 10 đến 20 số, nếu có 13 số thì bắt buộc dùng dấu gạch ngang phân tách 3 số cuối, VD: 0101234567-001)';
    } else if (errors.taxCode) {
      errs.taxCode = errors.taxCode;
    }

    if (!formData.loaiHinhId) errs.loaiHinhId = 'Vui lòng chọn loại hình kinh doanh';
    if (!formData.businessLineId) errs.businessLineId = 'Vui lòng chọn ngành nghề';
    if (!formData.province?.key) errs.province = 'Vui lòng chọn tỉnh/thành';
    if (!formData.ward?.key) errs.ward = 'Vui lòng chọn phường/xã';

    if (!formData.email?.trim()) {
      errs.email = 'Email không được để trống';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Email không hợp lệ , vui lòng kiểm tra lại dữ liệu';
    } else if (errors.email) {
      errs.email = errors.email;
    }

    if (formData.officePhone?.trim() && !validate.phone(formData.officePhone.trim())) {
      errs.officePhone = 'Số điện thoại không đúng định dạng';
    }
    if (formData.headPhone?.trim() && !validate.phone(formData.headPhone.trim())) {
      errs.headPhone = 'Số điện thoại không đúng định dạng';
    }

    if (formData.gpkdDate) {
      const gpkdDay = new Date(formData.gpkdDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (gpkdDay >= today) {
        errs.gpkdDate = 'Ngày cấp GPKD phải là ngày trong quá khứ';
      }
    }

    setErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setOtpError('');
      setOtpSuccess('Đang gửi mã OTP...');
      await authService.sendRegistrationOtp((formData.email || '').trim());
      setCountdown(60);
      setStep(1); // Go to OTP
      setOtpSuccess('Mã OTP đã được gửi đến email của bạn!');
    } catch (error: any) {
      setOtpSuccess('');
      const msg = getRegisterErrorMessage(error, 'Có lỗi khi gửi OTP');
      setOtpError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextToOtp = async () => {
    const isValidSync = validateStep1();
    if (!isValidSync) {
      enqueueSnackbar('Vui lòng kiểm tra các trường bắt buộc', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const taxCode = (formData.taxCode || '').trim();
      const name = (formData.name || '').trim();
      const email = (formData.email || '').trim();

      const [taxRes, nameRes, emailRes]: any[] = await Promise.all([
        DoetService.checkTaxCode(taxCode),
        DoetService.checkName(name),
        DoetService.checkEmail(email),
      ]);

      const taxExists = taxRes?.exists ?? taxRes?.data?.exists ?? false;
      const nameExists = nameRes?.exists ?? nameRes?.data?.exists ?? false;
      const emailExists = emailRes?.exists ?? emailRes?.data?.exists ?? false;

      const newErrors: Record<string, string> = {};
      if (taxExists) newErrors.taxCode = 'Mã số thuế này đã tồn tại trong hệ thống';
      if (nameExists) newErrors.name = 'Tên doanh nghiệp này đã tồn tại trong hệ thống';
      if (emailExists) newErrors.email = 'Email này đã được đăng ký';

      if (taxExists || nameExists || emailExists) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        if (taxExists) enqueueSnackbar('Mã số thuế này đã tồn tại trong hệ thống', { variant: 'error' });
        if (nameExists) enqueueSnackbar('Tên doanh nghiệp này đã tồn tại trong hệ thống', { variant: 'error' });
        if (emailExists) enqueueSnackbar('Email này đã được đăng ký', { variant: 'error' });
        return;
      }
    } catch (error) {
      // Ignore network errors, fallback to backend validation at submission
    } finally {
      setLoading(false);
    }

    await handleSendOtp();
  };


  const handleVerifyOtp = async () => {
    if (!validate.required(otp)) {
      setOtpError(VALIDATION_MESSAGES.REQUIRED);
      return;
    }
    if (!validate.otp(otp)) {
      setOtpError(VALIDATION_MESSAGES.OTP_INVALID);
      return;
    }
    try {
      setLoading(true);
      setOtpError('');
      setOtpSuccess('');
      await authService.verifyRegistrationOtp((formData.email || '').trim(), otp);
      setStep(2); // Go to confirmation
    } catch (error: any) {
      const backendMsg = error.response?.data?.errors || error.response?.data?.message || error.message || '';
      let displayMsg = 'Mã OTP không chính xác, vui lòng kiểm tra lại';
      if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('hết hạn')) {
        displayMsg = 'Mã OTP đã hết hạn, vui lòng kiểm tra lại';
      }
      setOtpError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => {
    const payload: any = { ...formData };
    if (payload.loaiHinhId) payload.loaiHinhKinhDoanh = { id: Number(payload.loaiHinhId) };
    if (payload.businessLineId) payload.businessLine = { id: Number(payload.businessLineId) };
    delete payload.loaiHinhId;
    delete payload.businessLineId;

    if (Array.isArray(payload.attachments)) {
      payload.attachments = payload.attachments.map((att: FileAttachment) => ({
        type: att.type,
        fileName: att.fileName || '',
        fileUrl: att.fileUrl?.startsWith('blob:') ? '' : att.fileUrl || '',
        fileInfo: att.fileInfo,
        mimeType: att.mimeType,
        size: att.size,
      }));
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await authService.registerEnterprise(buildPayload(), otp);
      enqueueSnackbar('Đăng ký doanh nghiệp thành công', { variant: 'success' });
      setStep(3); // Success account view
    } catch (error: any) {
      const msg = getRegisterErrorMessage(error, 'Có lỗi xảy ra');
      if (Array.isArray(msg)) {
        msg.forEach((m: string) => enqueueSnackbar(m, { variant: 'error' }));
      } else {
        enqueueSnackbar(msg, { variant: 'error' });
        if (msg.includes('OTP')) {
          setStep(1); // go back to OTP if invalid
          setOtpError(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachmentUpload = async (index: number, file: File) => {
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => {
      const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
      next[index] = { ...next[index], fileName: file.name, fileUrl: localUrl, mimeType: file.type, size: file.size };
      return { ...prev, attachments: next };
    });

    try {
      const res: any = await DoetService.uploadFile(file);
      const uploaded = res?.data || res;
      setFormData((prev) => {
        const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
        if (next[index].fileName === uploaded.fileName) {
          next[index] = { ...next[index], fileUrl: uploaded.fileUrl };
        }
        return { ...prev, attachments: next };
      });
    } catch (error) { }
  };

  const handleAttachmentRemove = (index: number) => {
    setFormData((prev) => {
      const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
      if (next[index]?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(next[index].fileUrl);
      next[index] = { type: next[index]?.type || 'OTHER', fileName: '', fileUrl: '' };
      return { ...prev, attachments: next };
    });
  };

  const provinceOptions = useMemo(() => Array.isArray(provinces) ? provinces : [], [provinces]);
  const regWardOptions = useMemo(() => Array.isArray(regWards) ? regWards : [], [regWards]);
  const opWardOptions = useMemo(() => Array.isArray(opWards) ? opWards : [], [opWards]);
  const loaiHinhOptions = useMemo(() => Array.isArray(loaiHinhs) ? loaiHinhs : [], [loaiHinhs]);
  const businessLineOptions = useMemo(() => Array.isArray(businessLines) ? businessLines : [], [businessLines]);

  const selectedLoaiHinh = loaiHinhOptions.find((l) => l.id === Number(formData.loaiHinhId)) || null;
  const selectedBusinessLine = businessLineOptions.find((b) => b.id === Number(formData.businessLineId)) || null;
  const selectedProvince = provinceOptions.find((p) => String(p.id) === String(formData.province?.key)) || null;
  const selectedWard = regWardOptions.find((w) => String(w.id) === String(formData.ward?.key)) || null;
  const selectedOpProvince = provinceOptions.find((p) => String(p.id) === String(formData.operatingProvince?.key)) || null;
  const selectedOpWard = opWardOptions.find((w) => String(w.id) === String(formData.operatingWard?.key)) || null;

  const wardDisabled = !formData.province?.key;
  const addressDisabled = !formData.ward?.key;
  const opWardDisabled = !formData.operatingProvince?.key;

  const gpkdFile = useMemo(() => (formData.attachments || []).find((a) => a.type === 'GPKD' && (a.fileUrl || a.fileName)), [formData.attachments]);

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box className={classes.card}>
        <Typography className={classes.sectionTitle}>Thêm mới doanh nghiệp</Typography>
        <Box className={classes.formGrid}>
          <TextField
            label={<RequiredLabel text="Tên doanh nghiệp" />}
            value={formData.name || ''}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={handleNameBlur}
            error={!!errors.name}
            helperText={errors.name}
            size="small"
            fullWidth
          />
          <TextField
            label={<RequiredLabel text="Mã số thuế" />}
            value={formData.taxCode || ''}
            onChange={(e) => setField('taxCode', e.target.value)}
            onBlur={handleTaxCodeBlur}
            error={!!errors.taxCode}
            helperText={errors.taxCode}
            size="small"
            fullWidth
          />
          <Autocomplete
            options={loaiHinhOptions}
            value={selectedLoaiHinh}
            onChange={(_, v) => setField('loaiHinhId', v?.id || undefined)}
            getOptionLabel={(opt) => opt?.tenloaihinh || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label={<RequiredLabel text="Loại hình kinh doanh" />} error={!!errors.loaiHinhId} helperText={errors.loaiHinhId} />
            )}
          />
          <Autocomplete
            options={businessLineOptions}
            value={selectedBusinessLine}
            onChange={(_, v) => setField('businessLineId', v?.id || undefined)}
            getOptionLabel={(opt) => opt ? `${opt.manganh} - ${opt.tennganh}` : ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label={<RequiredLabel text="Ngành nghề kinh doanh chính" />} error={!!errors.businessLineId} helperText={errors.businessLineId} />
            )}
          />
          <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Ngày cấp GPKD"
              value={dateInput}
              onChange={handleDateInputChange}
              size="small"
              fullWidth
              autoComplete="off"
              placeholder="DD/MM/YYYY"
              onClick={(e) => setCalendarAnchor(e.currentTarget)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {gpkdFile && (
                        <Tooltip title="Xem GPKD">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              let url = gpkdFile.fileUrl;
                              if (!url && gpkdFile.fileName) {
                                const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3800/api/v1').replace('/api/v1', '');
                                url = `${baseUrl}/uploads/${gpkdFile.fileName}`;
                              }
                              if (url) {
                                if (!url.startsWith('blob:') && !url.startsWith('http') && !url.startsWith('data:')) {
                                  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3800/api/v1').replace('/api/v1', '');
                                  url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
                                }
                                window.open(url, '_blank');
                              }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCalendarAnchor(e.currentTarget); }} sx={{ padding: '4px' }}>
                        <EventIcon fontSize="small" style={{ color: '#999' }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
            <CustomCalendar
              open={Boolean(calendarAnchor)}
              anchorEl={calendarAnchor}
              value={formData.gpkdDate ? formatDateInput(formData.gpkdDate) : ''}
              maxDate={new Date()}
              onChange={(val) => { setField('gpkdDate', val ? new Date(val) : null); setCalendarAnchor(null); }}
              onClose={() => setCalendarAnchor(null)}
            />
          </Box>
          <Autocomplete
            options={provinceOptions}
            value={selectedProvince}
            onChange={(_, v) => handleProvinceChange(v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label={<RequiredLabel text="Tỉnh/Thành phố ĐKKD" />} error={!!errors.province} helperText={errors.province} />
            )}
          />
          <Autocomplete
            options={regWardOptions}
            value={selectedWard}
            onChange={(_, v) => handleWardChange('reg', v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            disabled={wardDisabled}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField {...params} label={<RequiredLabel text="Phường/Xã ĐKKD" />} error={!!errors.ward} helperText={errors.ward} />
            )}
          />
          <TextField
            label="Địa chỉ"
            value={formData.address || ''}
            onChange={(e) => setField('address', e.target.value)}
            disabled={addressDisabled}
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      <Box className={classes.card}>
        <Typography className={classes.sectionTitle}>Thông tin liên hệ</Typography>
        <Box className={classes.formGrid}>
          <TextField label="Tên viết bằng tiếng nước ngoài" value={formData.name2 || ''} onChange={(e) => setField('name2', e.target.value)} size="small" fullWidth />
          <TextField label={<RequiredLabel text="Email" />} value={formData.email || ''} onChange={(e) => setField('email', e.target.value)} onBlur={handleEmailBlur} error={!!errors.email} helperText={errors.email} size="small" fullWidth />
          <TextField label="Số điện thoại cơ quan" value={formData.officePhone || ''} onChange={(e) => setField('officePhone', e.target.value)} error={!!errors.officePhone} helperText={errors.officePhone} size="small" fullWidth />
          <TextField label="Người đứng đầu doanh nghiệp" value={formData.headOfEnterprise || ''} onChange={(e) => setField('headOfEnterprise', e.target.value)} size="small" fullWidth />
          <TextField label="SĐT liên hệ người đứng đầu" value={formData.headPhone || ''} onChange={(e) => setField('headPhone', e.target.value)} error={!!errors.headPhone} helperText={errors.headPhone} size="small" fullWidth />
          <Autocomplete
            options={provinceOptions}
            value={selectedOpProvince}
            onChange={(_, v) => handleOpProvinceChange(v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Tỉnh/TP hoạt động KD" />}
          />
          <Autocomplete
            options={opWardOptions}
            value={selectedOpWard}
            onChange={(_, v) => handleWardChange('op', v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            disabled={opWardDisabled}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Phường/Xã hoạt động KD" />}
          />
          <TextField label="Địa điểm kinh doanh" value={formData.operatingAddress || ''} onChange={(e) => setField('operatingAddress', e.target.value)} size="small" fullWidth />
        </Box>

        <Typography className={classes.fileSubtitle}>File đính kèm</Typography>
        <EnterpriseAttachmentsTable attachments={formData.attachments || DEFAULT_ATTACHMENTS} onPreview={(f) => setPreviewFile(f)} onUpload={handleAttachmentUpload} onRemove={handleAttachmentRemove} />
      </Box>
    </Box>
  );

  const renderOtpStep = () => (
    <Dialog
      open={step === 1}
      onClose={() => setStep(0)}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', minWidth: 320 } } }}
    >
      <Box
        sx={{
          bgcolor: VNA_COLORS.primary,
          color: '#fff',
          textAlign: 'center',
          py: 1.25,
          fontWeight: 600,
          fontSize: '1.1rem',
        }}
      >
        Xác thực Email
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', mb: 1.5, textAlign: 'center' }}>
            Chúng tôi đã gửi mã xác minh qua email<br />
            <strong>{formData.email}</strong><br />
            Bạn vui lòng kiểm tra và điền mã xác thực
          </Typography>

          <Collapse in={!!otpError} sx={{ width: '100%', maxWidth: 300, mb: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255, 69, 58, 0.05)',
              border: `1px solid ${VNA_COLORS.error}`,
              borderRadius: 1,
              p: 1.5,
              textAlign: 'left'
            }}>
              <ErrorOutlinedIcon sx={{ color: VNA_COLORS.error, fontSize: '1.2rem' }} />
              <Typography style={{ color: VNA_COLORS.error, fontSize: "0.85rem", fontWeight: 500 }}>
                {otpError}
              </Typography>
            </Box>
          </Collapse>
          <Collapse in={!!otpSuccess} sx={{ width: '100%', maxWidth: 300, mb: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(52, 199, 89, 0.05)',
              border: `1px solid ${VNA_COLORS.success}`,
              borderRadius: 1,
              p: 1.5,
              textAlign: 'left'
            }}>
              <CheckCircleOutlinedIcon sx={{ color: VNA_COLORS.success, fontSize: '1.2rem' }} />
              <Typography style={{ color: VNA_COLORS.success, fontSize: "0.85rem", fontWeight: 500 }}>
                {otpSuccess}
              </Typography>
            </Box>
          </Collapse>

          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={<RequiredLabel text="Mã OTP" />}
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            onFocus={() => { setOtpError(''); setOtpSuccess(''); }}
            disabled={loading}
            sx={{ maxWidth: 300, mb: 2 }}
            slotProps={{ htmlInput: { maxLength: 6, style: { textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 600 } } }}
          />

          <Typography sx={{ color: '#2f65f0', fontWeight: 600, mb: 1 }}>
            00:{countdown.toString().padStart(2, '0')}
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 4 }}>
            Chưa nhận được mã?{' '}
            <Button
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontWeight: 600 }}
              disabled={countdown > 0 || loading}
              onClick={handleSendOtp}
            >
              Gửi lại
            </Button>
          </Typography>

          <Box sx={{ display: 'flex', width: '100%', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              disabled={loading}
              onClick={() => setStep(0)}
              sx={{ color: '#666', textTransform: 'none', fontWeight: 500 }}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: VNA_COLORS.primary, textTransform: 'none', fontWeight: 500, boxShadow: 'none', '&:hover': { bgcolor: VNA_COLORS.primaryHover } }}
              onClick={handleVerifyOtp}
            >
              Xác nhận
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderConfirmStep = () => {
    const rows: [string, React.ReactNode, boolean?][] = [
      ['Tên đăng nhập:', formData.taxCode, true],
      ['Mã số thuế :', formData.taxCode, true],
      ['Tên doanh nghiệp :', formData.name],
      ['Tên viết bằng tiếng nước ngoài :', formData.name2],
      ['Email :', formData.email],
      [
        'Ngày cấp GPKD:',
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
            {formData.gpkdDate ? formatDateDisplay(formData.gpkdDate) : ''}
          </Typography>
        </Box>,
      ],
      ['Loại hình kinh doanh:', selectedLoaiHinh?.tenloaihinh || ''],
      ['Ngành nghề kinh doanh :', selectedBusinessLine ? `${selectedBusinessLine.manganh} - ${selectedBusinessLine.tennganh}` : ''],
      ['Địa chỉ đăng kí giấy phép kinh doanh :', [formData.address, formData.ward?.value, formData.province?.value].filter(Boolean).join(', ')],
      ['Địa điểm kinh doanh :', [formData.operatingAddress, formData.operatingWard?.value, formData.operatingProvince?.value].filter(Boolean).join(', ')],
      ['Người đứng đầu doanh nghiệp', formData.headOfEnterprise],
      ['SĐT người đứng đầu', formData.headPhone],
    ];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box className={classes.card}>
          <Typography className={classes.sectionTitle}>Thông tin về hồ sơ</Typography>
          <Box className={classes.summaryGrid}>
            {rows.map(([label, value, isBoldValue]) => (
              <Box key={label as string} className={classes.summaryRow}>
                <Typography className={classes.summaryLabel}>{label as string}</Typography>
                <Box className={classes.summaryValue} sx={{ fontWeight: isBoldValue ? 700 : 500, display: 'flex', alignItems: 'center' }}>
                  {value || '-'}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box className={classes.card}>
          <EnterpriseAttachmentsTable attachments={formData.attachments || DEFAULT_ATTACHMENTS} readOnly onPreview={(f) => setPreviewFile(f)} />
        </Box>
      </Box>
    );
  };

  const renderSuccessStep = () => (
    <Dialog
      open={step === 3}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', minWidth: 320 } } }}
    >
      <Box
        sx={{
          bgcolor: VNA_COLORS.primary,
          color: '#fff',
          textAlign: 'center',
          py: 1.25,
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        Thông tin tài khoản
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Typography sx={{ mb: 1.5, fontSize: '0.95rem' }}>
          • Tài khoản: <strong>{formData.taxCode}</strong>
        </Typography>
        <Typography sx={{ fontSize: '0.95rem' }}>
          • Mật khẩu: <strong>12345678</strong>
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            onClick={onClose}
            sx={{ color: VNA_COLORS.primary, textTransform: 'none', fontWeight: 500 }}
          >
            Đóng
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        <Box className={classes.stepperWrapper} sx={{ pt: 4 }}>
          <Stepper activeStep={step >= 2 ? 1 : 0} className={classes.stepper}>
            <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Thông tin doanh nghiệp</StepLabel></Step>
            <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Xác nhận đăng ký</StepLabel></Step>
          </Stepper>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: '#f4f6f8', minHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>
          ) : (
            <Box className={classes.content}>
              {(step === 0 || step === 1) && renderStep1()}
              {(step === 2 || step === 3) && renderConfirmStep()}
            </Box>
          )}
        </DialogContent>

        {(step === 0 || step === 2) && (
          <Box className={classes.footer} sx={{ borderTop: '1px solid #eef0f4' }}>
            <Button onClick={step === 0 ? onClose : () => setStep(0)} className={classes.cancelBtn} disableRipple>
              {step === 0 ? 'Huỷ bỏ' : 'Trở về'}
            </Button>
            {step === 0 ? (
              <Button variant="contained" startIcon={<ChevronRightIcon />} onClick={handleNextToOtp} className={classes.primaryBtn} disableElevation>
                Tiếp tục
              </Button>
            ) : (
              <Button variant="contained" startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <DoneAllIcon />} onClick={handleSubmit} className={classes.primaryBtn} disabled={submitting} disableElevation>
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            )}
          </Box>
        )}

        <FilePreviewDialog open={!!previewFile} file={previewFile} onClose={() => setPreviewFile(null)} />
      </Dialog>

      {step === 1 && renderOtpStep()}
      {step === 3 && renderSuccessStep()}
    </>
  );
};