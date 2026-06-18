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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  KeyboardArrowRight as ChevronRightIcon,
  DoneAll as DoneAllIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
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

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidTaxCode = (taxCode: string) => /^\d{10}(-\d{3})?$/.test(taxCode);

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
  const [countdown, setCountdown] = useState(60);

  const [loaiHinhs, setLoaiHinhs] = useState<LoaiHinhKinhDoanh[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regWards, setRegWards] = useState<any[]>([]);
  const [opWards, setOpWards] = useState<any[]>([]);

  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);
  const [dateInput, setDateInput] = useState('');

  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setOtp('');
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
      setErrors((prev) => ({ ...prev, email: 'Email không đúng định dạng' }));
      return;
    }
    try {
      const res: any = await authService.checkEmailPublic(email);
      const exists = res?.existed ?? res?.data?.existed ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, email: 'Email này đã được đăng ký' }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    } catch (error) {
      // ignore
    }
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name?.trim()) errs.name = 'Tên doanh nghiệp không được để trống';
    if (!formData.taxCode?.trim()) {
      errs.taxCode = 'Mã số thuế không được để trống';
    } else if (!isValidTaxCode(formData.taxCode)) {
      errs.taxCode = 'Mã số thuế không hợp lệ';
    }
    if (!formData.loaiHinhId) errs.loaiHinhId = 'Vui lòng chọn loại hình kinh doanh';
    if (!formData.businessLineId) errs.businessLineId = 'Vui lòng chọn ngành nghề';
    if (!formData.province?.key) errs.province = 'Vui lòng chọn tỉnh/thành';
    if (!formData.ward?.key) errs.ward = 'Vui lòng chọn phường/xã';
    if (!formData.address?.trim()) errs.address = 'Địa chỉ không được để trống';
    if (!formData.email?.trim()) {
      errs.email = 'Email không được để trống';
    } else if (!isValidEmail(formData.email)) {
      errs.email = 'Email không đúng định dạng';
    } else if (errors.email) {
      errs.email = errors.email;
    }
    setErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await authService.sendRegistrationOtp((formData.email || '').trim());
      setCountdown(60);
      setStep(1); // Go to OTP
      enqueueSnackbar('Đã gửi mã xác thực đến email', { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi khi gửi OTP';
      enqueueSnackbar(msg, { variant: 'error' });
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
    await handleSendOtp();
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 6) {
      setOtpError('Mã OTP không hợp lệ');
      return;
    }
    setOtpError('');
    setStep(2); // Go to confirmation. Verification actually happens on final submit to prevent double-spending OTP
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
      const messages = error?.response?.data?.message || 'Có lỗi xảy ra';
      if (Array.isArray(messages)) {
        messages.forEach((m: string) => enqueueSnackbar(m, { variant: 'error' }));
      } else {
        enqueueSnackbar(messages, { variant: 'error' });
        if (messages.includes('OTP')) {
            setStep(1); // go back to OTP if invalid
            setOtpError(messages);
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
    } catch (error) {}
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
            error={!!errors.name}
            helperText={errors.name}
            size="small"
            fullWidth
          />
          <TextField
            label={<RequiredLabel text="Mã số thuế" />}
            value={formData.taxCode || ''}
            onChange={(e) => setField('taxCode', e.target.value)}
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
            getOptionLabel={(opt) => opt?.tennganh || ''}
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
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPreviewFile(gpkdFile); }}>
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
          <TextField label="Số điện thoại cơ quan" value={formData.officePhone || ''} onChange={(e) => setField('officePhone', e.target.value)} size="small" fullWidth />
          <TextField label="Người đứng đầu doanh nghiệp" value={formData.headOfEnterprise || ''} onChange={(e) => setField('headOfEnterprise', e.target.value)} size="small" fullWidth />
          <TextField label="SĐT liên hệ người đứng đầu" value={formData.headPhone || ''} onChange={(e) => setField('headPhone', e.target.value)} size="small" fullWidth />
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
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#2f65f0', textTransform: 'uppercase', mb: 2 }}>
        Xác thực Email
      </Typography>
      <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', mb: 0.5 }}>
        Chúng tôi đã gửi mã xác minh qua số email
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>
        {formData.email}
      </Typography>
      <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', mb: 3 }}>
        Bạn vui lòng kiểm tra và điền mã xác thực
      </Typography>

      <TextField
        label={<RequiredLabel text="OTP" />}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
        error={!!otpError}
        helperText={otpError}
        size="small"
        fullWidth
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
          disabled={countdown > 0}
          onClick={handleSendOtp}
        >
          Gửi lại
        </Button>
      </Typography>

      <Button
        variant="contained"
        fullWidth
        sx={{ maxWidth: 300, bgcolor: '#2f65f0', py: 1.2, mb: 2 }}
        onClick={handleVerifyOtp}
      >
        Xác nhận
      </Button>
      
      <Button
        sx={{ color: '#6b7280', textTransform: 'none' }}
        onClick={() => setStep(0)}
      >
        Hủy bỏ
      </Button>
    </Box>
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
      ['Ngành nghề kinh doanh :', selectedBusinessLine?.tennganh || ''],
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
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Box sx={{ bgcolor: '#2f65f0', color: '#fff', py: 1.5, mb: 3, borderRadius: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>Thông tin tài khoản</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', maxWidth: 300, mx: 'auto', mb: 4 }}>
        <Typography sx={{ fontSize: '1rem', color: '#1f2937' }}>
          • Tài khoản: <span style={{ fontWeight: 700 }}>{formData.taxCode}</span>
        </Typography>
        <Typography sx={{ fontSize: '1rem', color: '#1f2937' }}>
          • Mật khẩu: <span style={{ fontWeight: 700 }}>12345678</span>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
         <Button onClick={onClose} sx={{ color: '#2f65f0', fontWeight: 600, textTransform: 'none' }}>
           Đóng
         </Button>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={() => {}} maxWidth="lg" fullWidth>
      {step !== 1 && step !== 3 && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      )}

      {step !== 3 && (
        <Box className={classes.stepperWrapper} sx={{ pt: 4 }}>
          <Stepper activeStep={step === 2 ? 1 : 0} className={classes.stepper}>
            <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Thông tin doanh nghiệp</StepLabel></Step>
            <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Xác nhận đăng ký</StepLabel></Step>
          </Stepper>
        </Box>
      )}

      <DialogContent sx={{ p: 0, bgcolor: '#f4f6f8', minHeight: 400 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <Box className={classes.content}>
            {step === 0 && renderStep1()}
            {step === 1 && renderOtpStep()}
            {step === 2 && renderConfirmStep()}
            {step === 3 && renderSuccessStep()}
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
  );
};