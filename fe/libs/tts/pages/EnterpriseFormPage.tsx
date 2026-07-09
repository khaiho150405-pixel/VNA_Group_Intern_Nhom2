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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  CalendarToday as CalendarIcon,
  KeyboardArrowRight as ChevronRightIcon,
  DoneAll as DoneAllIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';


import { CustomCalendar } from '@core/components/CustomCalendar';
import { ChangeEmailModal } from '@core/components/ChangeEmailModal';
import { DoetService } from '@tts/services';
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

interface EnterpriseFormPageProps {
  mode: 'create' | 'edit' | 'view' | 'profile';
}

const DEFAULT_ATTACHMENTS: FileAttachment[] = [
  { type: 'GPKD', fileName: '', fileUrl: '' },
  { type: 'OTHER', fileName: '', fileUrl: '' },
];

const isValidEmail = (email: string) => validate.email(email);
const isValidTaxCode = (taxCode: string) => validate.taxCode(taxCode);

const getFormErrorMessage = (error: any, defaultMsg: string): string | string[] => {
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

const CustomStepIcon = (props: any) => renderStepIcon(props);

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
    backgroundColor:
      ownerState.active || ownerState.completed ? '#2f65f0' : '#e3e7ef',
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
  return (
    <StepDot ownerState={{ active, completed }}>{icon}</StepDot>
  );
};

export const EnterpriseFormPage = ({ mode }: EnterpriseFormPageProps) => {
  const router = useRouter();
  const params = useParams();
  const id = (params as any)?.id as string | undefined;
  const { enqueueSnackbar } = useSnackbar();
  const classes = useEnterpriseFormStyles();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isProfile = mode === 'profile';

  const [activeStep, setActiveStep] = useState(isView ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const hasChanges = () => {
    if (mode === 'create') return true;
    if (!originalData) return false;

    const normalizeString = (val: any) => (val === null || val === undefined ? '' : String(val).trim());
    const normalizeDate = (val: any) => {
      if (!val) return '';
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toISOString().slice(0, 10);
    };
    const normalizeObjKey = (obj: any) => (obj && obj.key ? String(obj.key) : '');

    const stringKeys = ['name', 'name2', 'taxCode', 'address', 'email', 'officePhone', 'operatingAddress', 'headOfEnterprise', 'headPhone'];
    for (const key of stringKeys) {
      if (normalizeString((formData as any)[key]) !== normalizeString(originalData[key])) {
        return true;
      }
    }

    const numberKeys = ['loaiHinhId', 'businessLineId'];
    for (const key of numberKeys) {
      const v1 = (formData as any)[key];
      const v2 = originalData[key];
      if (normalizeString(v1) !== normalizeString(v2)) {
        return true;
      }
    }

    if (normalizeDate(formData.gpkdDate) !== normalizeDate(originalData.gpkdDate)) {
      return true;
    }

    const objKeys = ['province', 'ward', 'operatingProvince', 'operatingWard'];
    for (const key of objKeys) {
      if (normalizeObjKey((formData as any)[key]) !== normalizeObjKey(originalData[key])) {
        return true;
      }
    }

    const atts1 = formData.attachments || [];
    const atts2 = originalData.attachments || [];
    if (atts1.length !== atts2.length) return true;
    for (let i = 0; i < atts1.length; i++) {
      const a1 = atts1[i];
      const a2 = atts2[i];
      if (normalizeString(a1.fileName) !== normalizeString(a2.fileName) ||
        normalizeString(a1.fileUrl) !== normalizeString(a2.fileUrl)) {
        return true;
      }
    }

    return false;
  };

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

  const [calendarAnchor, setCalendarAnchor] = useState<null | HTMLElement>(null);
  const [dateInput, setDateInput] = useState('');
  const [accountDialog, setAccountDialog] = useState({ open: false, username: '', password: '' });

  useEffect(() => {
    setDateInput(formatDateDisplay(formData.gpkdDate));
  }, [formData.gpkdDate]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow typing numbers and slashes
    const filtered = val.replace(/[^0-9/]/g, '');
    setDateInput(filtered);

    // Parse DD/MM/YYYY
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
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});


  const handleCalendarOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (isView) return;
    setCalendarAnchor(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchor(null);
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const [lh, bl, prov] = await Promise.all([
          DoetService.getLoaiHinhKinhDoanh(),
          DoetService.getBusinessLines(),
          DoetService.getProvinces(),
        ]);
        if (cancelled) return;
        const normalizedProvinces = normalizeListResponse(prov);
        setLoaiHinhs(normalizeListResponse(lh));
        setBusinessLines(normalizeListResponse(bl));
        setProvinces(normalizedProvinces);

        const searchParams = new URLSearchParams(window.location.search);
        const isImport = searchParams.get('mode') === 'import';

        if (id || mode === 'profile') {
          const enterprise: any = mode === 'profile'
            ? await DoetService.getMyCompany()
            : await DoetService.getById(Number(id));
          if (cancelled) return;
          const data = enterprise?.data || enterprise;
          const matchedData = {
            ...data,
            loaiHinhId: data?.loaiHinhKinhDoanh?.id,
            businessLineId: data?.businessLine?.id,
            attachments: Array.isArray(data?.attachments) && data.attachments.length
              ? data.attachments
              : DEFAULT_ATTACHMENTS,
          };
          setFormData(matchedData);
          setOriginalData(matchedData);

          if (data?.province?.key) {
            const wards = await DoetService.getDistricts(String(data.province.key));
            if (!cancelled) setRegWards(normalizeListResponse(wards));
          }
          if (data?.operatingProvince?.key) {
            const wards = await DoetService.getDistricts(String(data.operatingProvince.key));
            if (!cancelled) setOpWards(normalizeListResponse(wards));
          }
        } else if (isImport) {
          const raw = sessionStorage.getItem('pending_import_doet');
          if (raw) {
            const imported = JSON.parse(raw);
            sessionStorage.removeItem('pending_import_doet');

            // Match locations by name
            let matchedProvince: any = null;
            let matchedWard: any = null;
            let matchedOpProvince: any = null;
            let matchedOpWard: any = null;

            if (imported.provinceName) {
              matchedProvince = normalizedProvinces.find((p: any) =>
                p.name.toLowerCase().includes(imported.provinceName.toLowerCase()) ||
                imported.provinceName.toLowerCase().includes(p.name.toLowerCase())
              );

              if (matchedProvince) {
                const wardRes = await DoetService.getDistricts(String(matchedProvince.id));
                const wards = normalizeListResponse(wardRes);
                setRegWards(wards);

                if (imported.wardName) {
                  matchedWard = wards.find((w: any) =>
                    w.name.toLowerCase().includes(imported.wardName.toLowerCase()) ||
                    imported.wardName.toLowerCase().includes(w.name.toLowerCase())
                  );
                }
              }
            }

            if (imported.operatingProvinceName) {
              matchedOpProvince = normalizedProvinces.find((p: any) =>
                p.name.toLowerCase().includes(imported.operatingProvinceName.toLowerCase()) ||
                imported.operatingProvinceName.toLowerCase().includes(p.name.toLowerCase())
              );

              if (matchedOpProvince) {
                const wardRes = await DoetService.getDistricts(String(matchedOpProvince.id));
                const wards = normalizeListResponse(wardRes);
                setOpWards(wards);

                if (imported.operatingWardName) {
                  matchedOpWard = wards.find((w: any) =>
                    w.name.toLowerCase().includes(imported.operatingWardName.toLowerCase()) ||
                    imported.operatingWardName.toLowerCase().includes(w.name.toLowerCase())
                  );
                }
              }
            }

            setFormData(prev => ({
              ...prev,
              ...imported,
              province: matchedProvince ? { key: matchedProvince.id, value: matchedProvince.full_name || matchedProvince.name } : undefined,
              ward: matchedWard ? { key: matchedWard.id, value: matchedWard.full_name || matchedWard.name } : undefined,
              operatingProvince: matchedOpProvince ? { key: matchedOpProvince.id, value: matchedOpProvince.full_name || matchedOpProvince.name } : undefined,
              operatingWard: matchedOpWard ? { key: matchedOpWard.id, value: matchedOpWard.full_name || matchedOpWard.name } : undefined,
            }));

            setActiveStep(1); // Jump to step 2
          }
        }
      } catch (error) {
        if (!cancelled) enqueueSnackbar('Lỗi khi tải thông tin', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mode]);

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
    const kv: KeyValue | undefined = option
      ? { key: option.id, value: option.full_name || option.name || '' }
      : undefined;
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
      const res: any = await DoetService.checkEmail(email, id ? Number(id) : (formData.id ? Number(formData.id) : undefined));
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, email: 'Email này đã được đăng ký' }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    } catch (error) {
      // ignore network errors silently
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
      const res: any = await DoetService.checkTaxCode(taxCode, id ? Number(id) : (formData.id ? Number(formData.id) : undefined));
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, taxCode: 'Mã số thuế này đã tồn tại trong hệ thống' }));
      } else {
        setErrors((prev) => ({ ...prev, taxCode: '' }));
      }
    } catch (error) {
      // ignore network errors silently
    }
  };

  const handleNameBlur = async () => {
    const name = (formData.name || '').trim();
    if (!name) return;
    try {
      const res: any = await DoetService.checkName(name, id ? Number(id) : (formData.id ? Number(formData.id) : undefined));
      const exists = res?.exists ?? res?.data?.exists ?? false;
      if (exists) {
        setErrors((prev) => ({ ...prev, name: 'Tên doanh nghiệp này đã tồn tại trong hệ thống' }));
      } else {
        setErrors((prev) => ({ ...prev, name: '' }));
      }
    } catch (error) {
      // ignore network errors silently
    }
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

    if (dateInput?.trim() && !formData.gpkdDate) {
      errs.gpkdDate = 'Ngày cấp GPKD không đúng định dạng DD/MM/YYYY';
    } else if (formData.gpkdDate) {
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
    // 1. Run sync validation
    const isValidSync = validateStep1();
    if (!isValidSync) {
      enqueueSnackbar('Vui lòng kiểm tra các trường bắt buộc', { variant: 'warning' });
      return;
    }

    // 2. Run async duplicate checks
    const email = (formData.email || '').trim();
    const name = (formData.name || '').trim();
    const taxCode = (formData.taxCode || '').trim();

    let emailExists = false;
    let nameExists = false;
    let taxCodeExists = false;

    try {
      setLoading(true);
      const [emailRes, nameRes, taxCodeRes]: any[] = await Promise.all([
        DoetService.checkEmail(email, id ? Number(id) : (formData.id ? Number(formData.id) : undefined)),
        DoetService.checkName(name, id ? Number(id) : (formData.id ? Number(formData.id) : undefined)),
        DoetService.checkTaxCode(taxCode, id ? Number(id) : (formData.id ? Number(formData.id) : undefined)),
      ]);

      emailExists = emailRes?.exists ?? emailRes?.data?.exists ?? false;
      nameExists = nameRes?.exists ?? nameRes?.data?.exists ?? false;
      taxCodeExists = taxCodeRes?.exists ?? taxCodeRes?.data?.exists ?? false;

      const newErrors: Record<string, string> = {};

      if (emailExists) {
        newErrors.email = 'Email này đã được đăng ký';
      }
      if (nameExists) {
        newErrors.name = 'Tên doanh nghiệp này đã tồn tại';
      }
      if (taxCodeExists) {
        newErrors.taxCode = 'Mã số thuế này đã tồn tại';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
      }

      if (taxCodeExists) {
        enqueueSnackbar('Mã số thuế này đã tồn tại trong hệ thống', { variant: 'error' });
      }
      if (nameExists) {
        enqueueSnackbar('Tên doanh nghiệp này đã tồn tại trong hệ thống', { variant: 'error' });
      }
      if (emailExists) {
        enqueueSnackbar('Email này đã được đăng ký', { variant: 'error' });
      }

      if (emailExists || nameExists || taxCodeExists) {
        return; // BLOCK HERE
      }
    } catch (error) {
      // Allow proceeding if network check fails
    } finally {
      setLoading(false);
    }

    setActiveStep(1);
  };

  const handleBack = () => setActiveStep((p) => Math.max(0, p - 1));

  const buildPayload = () => {
    const payload: any = { ...formData };
    if (payload.loaiHinhId) {
      payload.loaiHinhKinhDoanh = { id: Number(payload.loaiHinhId) };
    }
    if (payload.businessLineId) {
      payload.businessLine = { id: Number(payload.businessLineId) };
    }
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

    if (isEdit || isProfile) {
      delete payload.taxCode;
      if (isProfile) {
        delete payload.email;
      }
    }
    return payload;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (mode === 'create') {
        await DoetService.create(buildPayload());
        enqueueSnackbar('Khai báo thành công', { variant: 'success' });
        const username = formData.taxCode || '';
        const password = '12345678';
        setTimeout(() => {
          setAccountDialog({ open: true, username, password });
        }, 1200);
      } else if (mode === 'edit' && id) {
        await DoetService.update(Number(id), buildPayload());
        enqueueSnackbar('Cập nhật thành công', { variant: 'success' });
        router.push('/doets');
      } else if (mode === 'profile') {
        await DoetService.updateMyCompany(buildPayload());
        enqueueSnackbar('Cập nhật thành công', { variant: 'success' });
        
        // Re-fetch the fresh and fully populated company details from database
        const freshRes: any = await DoetService.getMyCompany();
        const updated = freshRes?.data || freshRes;
        const matchedData = {
          ...updated,
          loaiHinhId: updated?.loaiHinhKinhDoanh?.id,
          businessLineId: updated?.businessLine?.id,
          attachments: Array.isArray(updated?.attachments) && updated.attachments.length
            ? updated.attachments
            : DEFAULT_ATTACHMENTS,
        };
        setFormData(matchedData);
        setOriginalData(matchedData);

        if (updated?.province?.key) {
          const wards = await DoetService.getDistricts(String(updated.province.key));
          setRegWards(normalizeListResponse(wards));
        }
        if (updated?.operatingProvince?.key) {
          const wards = await DoetService.getDistricts(String(updated.operatingProvince.key));
          setOpWards(normalizeListResponse(wards));
        }
        
        setActiveStep(0);
      }
    } catch (error: any) {
      const msg = getFormErrorMessage(error, 'Có lỗi xảy ra');
      if (Array.isArray(msg)) {
        msg.forEach((m: string) => enqueueSnackbar(m, { variant: 'error' }));
      } else {
        enqueueSnackbar(msg, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAccount = () => {
    setAccountDialog({ open: false, username: '', password: '' });
    router.push('/doets');
  };

  const handleAttachmentUpload = async (index: number, file: File) => {
    // 1. Create a local blob URL for immediate preview
    const localUrl = URL.createObjectURL(file);

    setFormData((prev) => {
      const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
      next[index] = {
        ...next[index],
        fileName: file.name,
        fileUrl: localUrl, // Set blob URL immediately
        mimeType: file.type,
        size: file.size,
      };
      return { ...prev, attachments: next };
    });

    try {
      // 2. Upload to server in the background
      const res: any = await DoetService.uploadFile(file);
      const uploaded = res?.data || res;

      // 3. Update with server URL once finished
      setFormData((prev) => {
        const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
        // Ensure we are updating the same slot (in case user changed it)
        if (next[index].fileName === uploaded.fileName) {
          next[index] = {
            ...next[index],
            fileUrl: uploaded.fileUrl,
          };
        }
        return { ...prev, attachments: next };
      });
    } catch (error) {
      // Silent catch: local preview still works even if server upload fails temporarily
    }
  };

  const handleAttachmentRemove = (index: number) => {
    setFormData((prev) => {
      const next = [...(prev.attachments || DEFAULT_ATTACHMENTS)];
      const previous = next[index];
      if (previous?.fileUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previous.fileUrl);
      }
      next[index] = { type: previous?.type || 'OTHER', fileName: '', fileUrl: '' };
      return { ...prev, attachments: next };
    });
  };

  const provinceOptions = useMemo(
    () => (Array.isArray(provinces) ? provinces : []),
    [provinces],
  );
  const regWardOptions = useMemo(() => (Array.isArray(regWards) ? regWards : []), [regWards]);
  const opWardOptions = useMemo(() => (Array.isArray(opWards) ? opWards : []), [opWards]);
  const loaiHinhOptions = useMemo(() => (Array.isArray(loaiHinhs) ? loaiHinhs : []), [loaiHinhs]);
  const businessLineOptions = useMemo(
    () => (Array.isArray(businessLines) ? businessLines : []),
    [businessLines],
  );

  const selectedLoaiHinh = loaiHinhOptions.find((l) => l.id === Number(formData.loaiHinhId)) || null;
  const selectedBusinessLine = businessLineOptions.find((b) => b.id === Number(formData.businessLineId)) || null;
  const selectedProvince = provinceOptions.find(
    (p) => String(p.id) === String(formData.province?.key),
  ) || null;
  const selectedWard = regWardOptions.find(
    (w) => String(w.id) === String(formData.ward?.key),
  ) || null;
  const selectedOpProvince = provinceOptions.find(
    (p) => String(p.id) === String(formData.operatingProvince?.key),
  ) || null;
  const selectedOpWard = opWardOptions.find(
    (w) => String(w.id) === String(formData.operatingWard?.key),
  ) || null;

  const wardDisabled = !formData.province?.key || isView;
  const addressDisabled = !formData.ward?.key || isView;
  const opWardDisabled = !formData.operatingProvince?.key || isView;

  const gpkdFile = useMemo(
    () => (formData.attachments || []).find((a) => a.type === 'GPKD' && (a.fileUrl || a.localFile || a.fileName)),
    [formData.attachments],
  );

  const titleByMode = isProfile
    ? 'Thông tin doanh nghiệp'
    : isEdit
      ? 'Cập nhật doanh nghiệp'
      : isView
        ? 'Thông tin doanh nghiệp'
        : 'Thêm mới doanh nghiệp';

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box className={classes.card}>
        <Typography className={classes.sectionTitle}>{titleByMode}</Typography>
        <Box className={classes.formGrid}>
          <TextField
            label={<RequiredLabel text="Tên doanh nghiệp" />}
            value={formData.name || ''}
            onChange={(e) => setField('name', e.target.value)}
            onBlur={handleNameBlur}
            disabled={isView}
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
            disabled={isView || isEdit || isProfile}
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
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.tenloaihinh}
                </li>
              );
            }}
            disabled={isView}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={<RequiredLabel text="Loại hình kinh doanh" />}
                error={!!errors.loaiHinhId}
                helperText={errors.loaiHinhId}
              />
            )}
          />
          <Autocomplete
            options={businessLineOptions}
            value={selectedBusinessLine}
            onChange={(_, v) => setField('businessLineId', v?.id || undefined)}
            getOptionLabel={(opt) => opt ? `${opt.manganh} - ${opt.tennganh}` : ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.manganh} - {option.tennganh}
                </li>
              );
            }}
            disabled={isView}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={<RequiredLabel text="Ngành nghề kinh doanh chính" />}
                error={!!errors.businessLineId}
                helperText={errors.businessLineId}
              />
            )}
          />
          <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Ngày cấp GPKD"
              value={dateInput}
              onChange={handleDateInputChange}
              disabled={isView}
              error={!!errors.gpkdDate}
              helperText={errors.gpkdDate}
              size="small"
              fullWidth
              autoComplete="off"
              placeholder="DD/MM/YYYY"
              onClick={(e) => !isView && setCalendarAnchor(e.currentTarget)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          !isView && setCalendarAnchor(e.currentTarget);
                        }}
                        disabled={isView}
                        sx={{ padding: '4px' }}
                      >
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
              onChange={(val) => {
                setField('gpkdDate', val ? new Date(val) : null);
                setCalendarAnchor(null);
              }}
              onClose={() => setCalendarAnchor(null)}
            />
          </Box>
          <Autocomplete
            options={provinceOptions}
            value={selectedProvince}
            onChange={(_, v) => handleProvinceChange(v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.full_name || option.name}
                </li>
              );
            }}
            disabled={isView}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={<RequiredLabel text="Tỉnh/Thành phố ĐKKD" />}
                error={!!errors.province}
                helperText={errors.province}
              />
            )}
          />
          <Autocomplete
            options={regWardOptions}
            value={selectedWard}
            onChange={(_, v) => handleWardChange('reg', v)}
            getOptionLabel={(opt) => opt?.full_name || opt?.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.full_name || option.name}
                </li>
              );
            }}
            disabled={wardDisabled}
            size="small"
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={<RequiredLabel text="Phường/Xã ĐKKD" />}
                error={!!errors.ward}
                helperText={errors.ward}
              />
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
          <TextField
            label="Tên viết bằng tiếng nước ngoài"
            value={formData.name2 || ''}
            onChange={(e) => setField('name2', e.target.value)}
            disabled={isView}
            size="small"
            fullWidth
          />
          {isProfile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label={<RequiredLabel text="Email" />}
                value={formData.email || ''}
                disabled
                size="small"
                fullWidth
              />
              <Button
                variant="text"
                onClick={() => setShowEmailModal(true)}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap', minWidth: 'auto' }}
                style= {{ fontWeight: 600 }}
              >
                Thay đổi
              </Button>
            </Box>
          ) : (
            <TextField
              label={<RequiredLabel text="Email" />}
              value={formData.email || ''}
              onChange={(e) => setField('email', e.target.value)}
              onBlur={handleEmailBlur}
              disabled={isView || isProfile}
              error={!!errors.email}
              helperText={errors.email}
              size="small"
              fullWidth
            />
          )}
          <TextField
            label="Số điện thoại cơ quan"
            value={formData.officePhone || ''}
            onChange={(e) => setField('officePhone', e.target.value)}
            disabled={isView}
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
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.full_name || option.name}
                </li>
              );
            }}
            disabled={isView}
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
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.id} {...optionProps}>
                  {option.full_name || option.name}
                </li>
              );
            }}
            disabled={opWardDisabled}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Phường/Xã hoạt động KD" />}
          />
          <Box />
          <TextField
            label="Địa điểm kinh doanh"
            value={formData.operatingAddress || ''}
            onChange={(e) => setField('operatingAddress', e.target.value)}
            disabled={isView}
            size="small"
            fullWidth
          />
          <TextField
            label="Người đứng đầu doanh nghiệp"
            value={formData.headOfEnterprise || ''}
            onChange={(e) => setField('headOfEnterprise', e.target.value)}
            disabled={isView}
            size="small"
            fullWidth
          />
          <TextField
            label="SĐT liên hệ người đứng đầu"
            value={formData.headPhone || ''}
            onChange={(e) => setField('headPhone', e.target.value)}
            disabled={isView}
            error={!!errors.headPhone}
            helperText={errors.headPhone}
            size="small"
            fullWidth
          />
        </Box>

        <Typography className={classes.fileSubtitle}>File đính kèm</Typography>
        <EnterpriseAttachmentsTable
          attachments={formData.attachments || DEFAULT_ATTACHMENTS}
          readOnly={isView}
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
                <Box
                  className={classes.summaryValue}
                  sx={{
                    fontWeight: isBoldValue ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {value || '-'}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box className={classes.card}>
          <EnterpriseAttachmentsTable
            attachments={formData.attachments || DEFAULT_ATTACHMENTS}
            readOnly
            onPreview={(f) => setPreviewFile(f)}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        {isProfile && (<>
        {/* Page Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 0,
          padding: '16px 24px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #eef0f4',
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          minHeight: '64px',
        }}>
          <Typography sx={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            color: '#1a1a1a'
          }}>
            {titleByMode}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button 
              className={classes.cancelBtn} 
              disableRipple 
              disabled={submitting}
              onClick={() => router.push(isProfile ? '/' : '/doets')}
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
            {activeStep === 0 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={submitting || (isEdit || isProfile ? !hasChanges() : false)}
                sx={{
                  textTransform: 'none',
                  backgroundColor: '#2f65f0',
                  px: 3,
                  py: 0.5,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  boxShadow: '0px 4px 12px rgba(47, 101, 240, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#1e4fd1',
                    boxShadow: '0px 8px 20px rgba(47, 101, 240, 0.35)'
                  },
                  ...(submitting || ((isEdit || isProfile) && !hasChanges()) ? {
                    backgroundColor: '#b0b0b0 !important',
                    cursor: 'not-allowed',
                    boxShadow: 'none !important'
                  } : {})
                }}
              >
                {submitting ? 'Đang lưu...' : (isEdit || isProfile ? 'Chỉnh sửa' : 'Tiếp tục')}
              </Button>
            ) : (
              !isView && (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={submitting || ((isEdit || isProfile) && !hasChanges())}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: '#2f65f0',
                    px: 3,
                    py: 0.5,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    boxShadow: '0px 4px 12px rgba(47, 101, 240, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: '#1e4fd1',
                      boxShadow: '0px 8px 20px rgba(47, 101, 240, 0.35)'
                    },
                    ...(submitting || ((isEdit || isProfile) && !hasChanges()) ? {
                      backgroundColor: '#b0b0b0 !important',
                      cursor: 'not-allowed',
                      boxShadow: 'none !important'
                    } : {})
                  }}
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận'}
                </Button>
              )
            )}
          </Box>
        </Box>
      </>)}
        <Box 
          className={classes.stepperWrapper}
          sx={{
            position: isProfile ? 'sticky' : 'static',
            top: isProfile ? '64px' : 'auto',
            zIndex: isProfile ? 9 : 'auto',
            boxShadow: isProfile ? '0px 2px 12px rgba(0, 0, 0, 0.04)' : 'none',
          }}
        >
          <Stepper
            activeStep={activeStep}
            className={classes.stepper}
          >
            <Step>
              <StepLabel slots={{ stepIcon: CustomStepIcon }}>Thông tin doanh nghiệp</StepLabel>
            </Step>
            <Step>
              <StepLabel slots={{ stepIcon: CustomStepIcon }}>
                {isEdit || isProfile ? 'Xác nhận chỉnh sửa' : 'Xác nhận đăng ký'}
              </StepLabel>
            </Step>
          </Stepper>
        </Box>

        {loading ? (
          <Box sx={{ padding: '24px 24px 32px 24px', flex: 1, backgroundColor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          </Box>
        ) : (
          <Box sx={{ padding: '24px 24px 32px 24px', flex: 1, backgroundColor: '#ffffff' }}>
            {activeStep === 0 ? renderStep1() : renderStep2()}
          </Box>
        )}

        {isProfile ? null : (
          <Box className={classes.footer}>
            <Button
              onClick={() => (activeStep === 0 || isView ? router.push('/doets') : setActiveStep(0))}
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
                disabled={isEdit && !hasChanges()}
              >
                Tiếp tục
              </Button>
            ) : (
              !isView && (
                <Button
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <DoneAllIcon />}
                  onClick={handleSubmit}
                  className={classes.primaryBtn}
                  disabled={submitting}
                  disableElevation
                >
                  {submitting ? '\u0110ang lưu...' : 'Xác nhận'}
                </Button>
              )
            )}
          </Box>
        )}

        <FilePreviewDialog
          open={!!previewFile}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
        <EnterpriseAccountDialog
          open={accountDialog.open}
          onClose={() => {
            setAccountDialog((prev) => ({ ...prev, open: false }));
            router.push('/doets');
          }}
          username={accountDialog.username}
          password={accountDialog.password}
        />
        <ChangeEmailModal
          open={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onEmailChanged={(newEmail) => setField('email', newEmail)}
        />
      </Box>
  );
};
