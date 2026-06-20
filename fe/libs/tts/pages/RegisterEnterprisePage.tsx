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
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CalendarToday as CalendarIcon,
  KeyboardArrowRight as ChevronRightIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';

// Lưu ý: Tùy vào project, bạn có thể thay MainLayout bằng AuthLayout (Layout cho trang đăng nhập/đăng ký)
import { DoetService } from '@tts/services'; // Gọi API
import { CustomCalendar } from '@core/components/CustomCalendar';
import {
  Doet,
  LoaiHinhKinhDoanh,
  BusinessLine,
  KeyValue,
  FileAttachment,
} from '@shared/tts/models';

import { EnterpriseAttachmentsTable } from '../components/EnterpriseAttachmentsTable';
import { FilePreviewDialog } from '../components/FilePreviewDialog';
import { EnterpriseAccountDialog } from '../components/EnterpriseAccountDialog';
import { useEnterpriseFormStyles } from '../logic/enterprise/form-style';
import { normalizeListResponse, formatDateInput, formatDateDisplay } from '@core/utils/helper';
import { validate } from '@core/utils/validation';

const DEFAULT_ATTACHMENTS: FileAttachment[] = [
  { type: 'GPKD', fileName: '', fileUrl: '' },
  { type: 'OTHER', fileName: '', fileUrl: '' },
];

const isValidEmail = (email: string) => validate.email(email);
const isValidTaxCode = (taxCode: string) => validate.taxCode(taxCode);

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

const CustomStepIcon = (props: any) => {
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

export const RegisterEnterprisePage = () => {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const classes = useEnterpriseFormStyles();

  const [activeStep, setActiveStep] = useState(0);
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
  const [loaiHinhs, setLoaiHinhs] = useState<LoaiHinhKinhDoanh[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regWards, setRegWards] = useState<any[]>([]);
  const [opWards, setOpWards] = useState<any[]>([]);

  const [accountDialog, setAccountDialog] = useState({ open: false, username: '', password: '' });
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const [lh, bl, prov] = await Promise.all([
          DoetService.getLoaiHinhKinhDoanh(true),
          DoetService.getBusinessLines(true),
          DoetService.getProvinces(),
        ]);
        if (cancelled) return;
        setLoaiHinhs(normalizeListResponse(lh));
        setBusinessLines(normalizeListResponse(bl));
        setProvinces(normalizeListResponse(prov));
      } catch (error) {
        if (!cancelled) enqueueSnackbar('Lỗi khi tải thông tin hệ thống', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

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
    } catch (e) { setRegWards([]); }
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
    } catch (e) { setOpWards([]); }
  };

  const handleWardChange = (type: 'reg' | 'op', option: any) => {
    const kv: KeyValue | undefined = option
      ? { key: option.id, value: option.full_name || option.name || '' }
      : undefined;
    if (type === 'reg') {
      setField('ward', kv);
      if (!kv) setField('address', '');
    } else setField('operatingWard', kv);
  };

  const handleEmailBlur = async () => {
    const email = (formData.email || '').trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, email: 'Email không đúng định dạng' }));
      return;
    }
    try {
      const res: any = await DoetService.checkEmail(email);
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, email: 'Email này đã được đăng ký' }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    } catch (error) { }
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
      errs.email = 'Email không đúng định dạng';
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

  const handleNext = async () => {
    if (!validateStep1()) {
      enqueueSnackbar('Vui lòng kiểm tra các trường bắt buộc', { variant: 'warning' });
      return;
    }

    const email = (formData.email || '').trim();
    const name = (formData.name || '').trim();
    const taxCode = (formData.taxCode || '').trim();

    try {
      setLoading(true);
      const [emailRes, nameRes, taxCodeRes]: any[] = await Promise.all([
        DoetService.checkEmail(email),
        DoetService.checkName(name),
        DoetService.checkTaxCode(taxCode),
      ]);

      const emailExists = emailRes?.exists ?? emailRes?.data?.exists ?? false;
      const nameExists = nameRes?.exists ?? nameRes?.data?.exists ?? false;
      const taxCodeExists = taxCodeRes?.exists ?? taxCodeRes?.data?.exists ?? false;

      const newErrors: Record<string, string> = {};
      if (emailExists) newErrors.email = 'Email này đã được đăng ký';
      if (nameExists) newErrors.name = 'Tên doanh nghiệp này đã tồn tại';
      if (taxCodeExists) newErrors.taxCode = 'Mã số thuế này đã tồn tại';

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        if (taxCodeExists) enqueueSnackbar('Mã số thuế đã tồn tại', { variant: 'error' });
        if (nameExists) enqueueSnackbar('Tên doanh nghiệp đã tồn tại', { variant: 'error' });
        if (emailExists) enqueueSnackbar('Email đã được đăng ký', { variant: 'error' });
        return;
      }
    } catch (error) { } finally {
      setLoading(false);
    }
    setActiveStep(1);
  };

  const buildPayload = () => {
    const payload: any = { ...formData };
    if (payload.loaiHinhId) payload.loaiHinhKinhDoanh = { id: Number(payload.loaiHinhId) };
    if (payload.businessLineId) payload.businessLine = { id: Number(payload.businessLineId) };

    // Xóa rác trước khi đẩy API
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
      await DoetService.publicRegister(buildPayload());

      enqueueSnackbar('Đăng ký tài khoản doanh nghiệp thành công!', { variant: 'success' });
      const username = formData.taxCode || '';
      const password = '12345678';
      setAccountDialog({ open: true, username, password });
    } catch (error: any) {
      const msg = getRegisterErrorMessage(error, 'Có lỗi xảy ra');
      if (Array.isArray(msg)) {
        msg.forEach((m: string) => enqueueSnackbar(m, { variant: 'error' }));
      } else {
        enqueueSnackbar(msg, { variant: 'error' });
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

  const provinceOptions = useMemo(() => (Array.isArray(provinces) ? provinces : []), [provinces]);
  const regWardOptions = useMemo(() => (Array.isArray(regWards) ? regWards : []), [regWards]);
  const opWardOptions = useMemo(() => (Array.isArray(opWards) ? opWards : []), [opWards]);
  const loaiHinhOptions = useMemo(() => (Array.isArray(loaiHinhs) ? loaiHinhs : []), [loaiHinhs]);
  const businessLineOptions = useMemo(() => (Array.isArray(businessLines) ? businessLines : []), [businessLines]);

  const selectedLoaiHinh = loaiHinhOptions.find((l) => l.id === Number(formData.loaiHinhId)) || null;
  const selectedBusinessLine = businessLineOptions.find((b) => b.id === Number(formData.businessLineId)) || null;
  const selectedProvince = provinceOptions.find((p) => String(p.id) === String(formData.province?.key)) || null;
  const selectedWard = regWardOptions.find((w) => String(w.id) === String(formData.ward?.key)) || null;
  const selectedOpProvince = provinceOptions.find((p) => String(p.id) === String(formData.operatingProvince?.key)) || null;
  const selectedOpWard = opWardOptions.find((w) => String(w.id) === String(formData.operatingWard?.key)) || null;

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box className={classes.card}>
        <Typography className={classes.sectionTitle}>Thông tin doanh nghiệp</Typography>
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
              fullWidth
              label="Ngày cấp GPKD"
              variant="outlined"
              size="small"
              value={formData.gpkdDate ? formatDateDisplay(formData.gpkdDate) : ''}
              placeholder="DD/MM/YYYY"
              autoComplete="off"
              onClick={(e) => setCalendarAnchor(e.currentTarget)}
              sx={{ '& .MuiOutlinedInput-root': { pr: '4px' } }}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={(e) => setCalendarAnchor(e.currentTarget)} sx={{ padding: '4px' }}>
                        <CalendarIcon fontSize="small" style={{ color: '#999' }} />
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
              onChange={(val) => setField('gpkdDate', val ? new Date(val) : null)}
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
            disabled={!formData.province?.key}
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
            disabled={!formData.ward?.key}
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      <Box className={classes.card}>
        <Typography className={classes.sectionTitle}>Thông tin liên hệ</Typography>
        <Box className={classes.formGrid}>
          <TextField
            label="Tên viết bằng tiếng nước ngoài"
            value={formData.name2 || ''}
            onChange={(e) => setField('name2', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label={<RequiredLabel text="Email" />}
            value={formData.email || ''}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={handleEmailBlur}
            error={!!errors.email}
            helperText={errors.email}
            size="small"
            fullWidth
          />
          <TextField
            label="Số điện thoại cơ quan"
            value={formData.officePhone || ''}
            onChange={(e) => setField('officePhone', e.target.value)}
            error={!!errors.officePhone}
            helperText={errors.officePhone}
            size="small"
            fullWidth
          />
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
            disabled={!formData.operatingProvince?.key}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Phường/Xã hoạt động KD" />}
          />
          <Box />
          <TextField
            label="Địa điểm kinh doanh"
            value={formData.operatingAddress || ''}
            onChange={(e) => setField('operatingAddress', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Người đứng đầu doanh nghiệp"
            value={formData.headOfEnterprise || ''}
            onChange={(e) => setField('headOfEnterprise', e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="SĐT liên hệ người đứng đầu"
            value={formData.headPhone || ''}
            onChange={(e) => setField('headPhone', e.target.value)}
            error={!!errors.headPhone}
            helperText={errors.headPhone}
            size="small"
            fullWidth
          />
        </Box>

        <Typography className={classes.fileSubtitle}>File đính kèm</Typography>
        <EnterpriseAttachmentsTable
          attachments={formData.attachments || DEFAULT_ATTACHMENTS}
          onPreview={(f) => setPreviewFile(f)}
          onUpload={handleAttachmentUpload}
          onRemove={handleAttachmentRemove}
        />
      </Box>
    </Box>
  );

  const renderStep2 = () => {
    const rows: [string, React.ReactNode, boolean?][] = [
      ['Mã số thuế :', formData.taxCode, true],
      ['Tên doanh nghiệp :', formData.name],
      ['Tên viết bằng tiếng nước ngoài :', formData.name2],
      [
        'Ngày cấp GPKD:',
        formData.gpkdDate ? formatDateDisplay(formData.gpkdDate) : '',
      ],
      ['Email', formData.email],
      ['Loại hình kinh doanh:', selectedLoaiHinh?.tenloaihinh || ''],
      [
        'Ngành nghề kinh doanh',
        selectedBusinessLine ? `${selectedBusinessLine.manganh} - ${selectedBusinessLine.tennganh}` : '',
      ],
      [
        'Địa chỉ đăng kí giấy phép kinh doanh :',
        [formData.address, formData.ward?.value, formData.province?.value]
          .filter(Boolean)
          .join(', '),
      ],
      [
        'Địa điểm kinh doanh :',
        [formData.operatingAddress, formData.operatingWard?.value, formData.operatingProvince?.value]
          .filter(Boolean)
          .join(', '),
      ],
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

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f6f8', py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1000, margin: '0 auto', backgroundColor: 'white', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', p: { xs: 3, md: 5 } }}>
        <Box className={classes.root}>
          <Box className={classes.stepperWrapper}>
            <Stepper activeStep={activeStep} className={classes.stepper}>
              <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Thông tin doanh nghiệp</StepLabel></Step>
              <Step><StepLabel slots={{ stepIcon: CustomStepIcon }}>Xác nhận đăng ký</StepLabel></Step>
            </Stepper>
          </Box>

          {loading ? (
            <Box className={classes.content} sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box className={classes.content}>
              {activeStep === 0 ? renderStep1() : renderStep2()}
            </Box>
          )}

          <Box className={classes.footer}>
            <Button
              onClick={() => (activeStep === 0 ? router.push('/login') : setActiveStep(0))}
              className={classes.cancelBtn}
              disableRipple
            >
              {activeStep === 0 ? 'Huỷ bỏ' : 'Trở về'}
            </Button>

            {activeStep === 0 ? (
              <Button
                variant="contained"
                startIcon={<ChevronRightIcon />}
                onClick={handleNext}
                className={classes.primaryBtn}
                disableElevation
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <DoneAllIcon />}
                onClick={handleSubmit}
                className={classes.primaryBtn}
                disabled={submitting}
                disableElevation
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            )}
          </Box>

          <FilePreviewDialog open={!!previewFile} file={previewFile} onClose={() => setPreviewFile(null)} />
          <EnterpriseAccountDialog
            open={accountDialog.open}
            onClose={() => {
              setAccountDialog((prev) => ({ ...prev, open: false }));
              router.push('/login');
            }}
            username={accountDialog.username}
            password={accountDialog.password}
          />
        </Box>
      </Box>
    </Box>
  );
};