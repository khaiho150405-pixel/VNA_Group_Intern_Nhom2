"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Select,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Switch,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FileUpload as UploadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";

import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";
import { usePermission } from "@core/hooks/usePermission";

import { businessLineService } from "@tts/services";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  pageHeader: {
    backgroundColor: "#fff",
    padding: theme.spacing(2, 3),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.04)",
    zIndex: 1,
    minHeight: 64,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#333",
    margin: 0,
    lineHeight: 1.4,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  importBtn: {
    backgroundColor: "#fff",
    color: "#2f65f0",
    border: "1px solid #2f65f0",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
    padding: theme.spacing(0.6, 2),
    borderRadius: 6,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(47, 101, 240, 0.04)",
    },
  },
  addBtn: {
    backgroundColor: "#2f65f0",
    color: "#fff",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
    padding: theme.spacing(0.6, 2),
    borderRadius: 6,
    boxShadow: "0px 4px 12px rgba(47, 101, 240, 0.2)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "#1e4fd1",
      boxShadow: "0px 8px 20px rgba(47, 101, 240, 0.35)",
    },
  },
  mainContent: {
    padding: theme.spacing(3),
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.02)",
    border: "1px solid #f0f0f0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  tableScroll: {
    flex: 1,
    overflow: "auto",
  },
  headerCell: {
    fontWeight: 600,
    color: "#5a6478",
    fontSize: "0.85rem",
    backgroundColor: "#f8fafc",
    borderBottom: "none",
    padding: "12px 16px",
    whiteSpace: "nowrap",
    height: "48px",
    boxSizing: "border-box",
  },
  filterCell: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #eef0f4",
    padding: "8px 12px",
    position: "sticky !important" as any,
    top: "48px !important",
    zIndex: "3 !important" as any,
  },
  bodyCell: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "#333",
    borderBottom: "1px solid #f3f5f9",
    fontWeight: 400,
  },
  filterField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 4,
      backgroundColor: "#fff",
      fontSize: "0.85rem",
      "& fieldset": { borderColor: "#dfe3eb" },
      "&:hover fieldset": { borderColor: "#bcc4d3" },
      "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
    },
    "& .MuiOutlinedInput-input": {
      padding: "7px 10px",
    },
  },
  actionIcon: {
    color: "#94a3b8",
    padding: 4,
    "&:hover": {
      color: "#2f65f0",
      backgroundColor: "rgba(47,101,240,0.08)",
    },
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.25, 2),
    borderTop: "1px solid #eef0f4",
    backgroundColor: "#fff",
  },
  pageInfo: {
    fontSize: "0.85rem",
    color: "#5a6478",
  },
  pageSizeSelect: {
    height: 32,
    fontSize: "0.85rem",
    minWidth: 64,
    "& fieldset": { borderColor: "#dfe3eb" },
  },
}));

interface CustomPaginationProps {
  page: number;
  count: number;
  onChange: (newPage: number) => void;
  isZeroBased?: boolean;
}

const CustomPagination = ({ page, count, onChange, isZeroBased = false }: CustomPaginationProps) => {
  const currentPage = isZeroBased ? page + 1 : page;
  const [val, setVal] = React.useState(String(currentPage));

  React.useEffect(() => {
    setVal(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = () => {
    const p = parseInt(val, 10);
    if (!isNaN(p) && p >= 1 && p <= count) {
      onChange(isZeroBased ? p - 1 : p);
    } else {
      setVal(String(currentPage));
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <IconButton
        size="small"
        onClick={() => onChange(isZeroBased ? page - 1 : page - 1)}
        disabled={currentPage <= 1}
        sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}
      >
        <ChevronLeftIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
      <Box sx={{ width: '24px', height: '24px', backgroundColor: '#f1f3f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handlePageSubmit(); }}
          onBlur={handlePageSubmit}
          style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', padding: 0 }}
        />
      </Box>
      <IconButton
        size="small"
        onClick={() => onChange(isZeroBased ? page + 1 : page + 1)}
        disabled={currentPage >= count}
        sx={{ color: '#94a3b8', '&.Mui-disabled': { color: '#cbd5e1' }, p: '2px' }}
      >
        <ChevronRightIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
    </Box>
  );
};

interface BusinessLine {
  id: number;
  manganh: string;
  tennganh: string;
  cap: number;
  trangthai?: string;
}

const getDashPrefix = (cap: number): string => {
  if (cap === 2) return "— ";
  if (cap === 3) return "—— ";
  if (cap === 4) return "——— ";
  return "";
};

const DialogAny = Dialog as any;
const TextFieldAny = TextField as any;
const AutocompleteAny = Autocomplete as any;

export const BusinessLinePage = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermission();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BusinessLine[]>([]);
  const [total, setTotal] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    manganh: "",
    tennganh: "",
    cap: "",
  });

  // Bulk Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BusinessLine | null>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    manganh: "",
    tennganh: "",
    cap: 1,
    trangthai: "ACTIVE",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [allBusinessLines, setAllBusinessLines] = useState<BusinessLine[]>([]);

  const fetchAllBusinessLines = async () => {
    try {
      const res: any = await businessLineService.getAll({ pageSize: 1000 });
      const items = res?.data?.items || res?.items || [];
      setAllBusinessLines(items);
    } catch (err) {
      console.error("Error fetching all business lines", err);
    }
  };

  useEffect(() => {
    fetchAllBusinessLines();
  }, []);

  const handleMaNganhChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().slice(0, 4);
    const cleanVal = uppercaseVal.replace(/[^A-Z0-9]/g, "");
    setForm((prev) => ({
      ...prev,
      manganh: cleanVal,
      cap: cleanVal.length || 1,
    }));
    if (formErrors.manganh) setFormErrors((prev) => ({ ...prev, manganh: "" }));
  };

  const parentGroup = useMemo(() => {
    const code = form.manganh.trim();
    if (code.length <= 1) return null;
    let parentCode = "";
    if (code.length === 2) {
      const num = parseInt(code, 10);
      if (isNaN(num)) return null;
      if (num >= 1 && num <= 3) parentCode = 'A';
      else if (num >= 5 && num <= 9) parentCode = 'B';
      else if (num >= 10 && num <= 33) parentCode = 'C';
      else if (num === 35) parentCode = 'D';
      else if (num >= 36 && num <= 39) parentCode = 'E';
      else if (num >= 41 && num <= 43) parentCode = 'F';
      else if (num >= 45 && num <= 47) parentCode = 'G';
      else if (num >= 49 && num <= 53) parentCode = 'H';
      else if (num >= 55 && num <= 56) parentCode = 'I';
      else if (num >= 58 && num <= 63) parentCode = 'J';
      else if (num >= 64 && num <= 66) parentCode = 'K';
      else if (num === 68) parentCode = 'L';
      else if (num >= 69 && num <= 75) parentCode = 'M';
      else if (num >= 77 && num <= 82) parentCode = 'N';
      else if (num === 84) parentCode = 'O';
      else if (num === 85) parentCode = 'P';
      else if (num >= 86 && num <= 88) parentCode = 'Q';
      else if (num >= 90 && num <= 93) parentCode = 'R';
      else if (num >= 94 && num <= 96) parentCode = 'S';
      else if (num >= 97 && num <= 98) parentCode = 'T';
      else if (num === 99) parentCode = 'U';
      else return null;
    } else {
      parentCode = code.slice(0, -1);
    }
    return allBusinessLines.find((item) => item.manganh === parentCode) || null;
  }, [form.manganh, allBusinessLines]);

  const parentNotFound = useMemo(() => {
    const code = form.manganh.trim();
    return code.length > 1 && !parentGroup;
  }, [form.manganh, parentGroup]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const where: any = {};
      if (filters.manganh) where.manganh = { operation: "like", value: `%${filters.manganh}%` };
      if (filters.tennganh) where.tennganh = { operation: "like", value: `%${filters.tennganh}%` };
      if (filters.cap) where.cap = { operation: "=", value: Number(filters.cap) };
      if (filters.trangthai) where.trangthai = { operation: "=", value: filters.trangthai };

      const params = {
        pageNumber: filters.page - 1,
        pageSize: filters.limit,
        where: JSON.stringify(where)
      };

      const res: any = await businessLineService.getAll(params);
      const items = res?.data?.items || res?.items || [];
      const totalCount = res?.data?.count ?? res?.count ?? 0;
      setData(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching business line list", err);
      enqueueSnackbar("Lỗi khi tải danh sách ngành nghề", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters]);

  const handleFilterChange = (field: string, val: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [field]: val,
      page: field === "page" ? val : 1, // reset page to 1 on other filter changes
    }));
    if (field !== "page" && field !== "limit") {
      setSelectedIds([]);
    }
  };

  const handleSelectAll = () => {
    if (data.length === 0) return;
    const allChecked = data.every((item) => selectedIds.includes(String(item.id)));
    if (allChecked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => String(item.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteMany = async () => {
    setConfirmBulkDeleteOpen(false);
    try {
      setLoading(true);
      await businessLineService.deleteMany(selectedIds.map(Number));
      enqueueSnackbar("Xóa các ngành nghề kinh doanh thành công", { variant: "success" });
      setSelectedIds([]);
      fetchList();
      fetchAllBusinessLines();
    } catch (err: any) {
      console.error("Error bulk deleting", err);
      const resData = err?.response?.data;
      let errorMsg = "Lỗi khi xóa";
      if (resData?.errors) {
        if (typeof resData.errors === "string") errorMsg = resData.errors;
        else if (typeof resData.errors === "object" && resData.errors.message) {
          const errMsg = resData.errors.message;
          errorMsg = Array.isArray(errMsg) ? errMsg[0] : errMsg;
        }
      } else if (resData?.message && resData.message !== "BAD REQUEST") {
        errorMsg = Array.isArray(resData.message) ? resData.message[0] : resData.message;
      }
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      manganh: "",
      tennganh: "",
      cap: 1,
      trangthai: "ACTIVE",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: BusinessLine) => {
    setEditId(item.id);
    setForm({
      manganh: item.manganh,
      tennganh: item.tennganh,
      cap: item.cap,
      trangthai: item.trangthai || "ACTIVE",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const trimmedMa = form.manganh.trim();
    const trimmedTen = form.tennganh.trim();

    if (!trimmedMa) {
      errors.manganh = "Vui lòng nhập mã ngành";
    } else if (trimmedMa.length < 1 || trimmedMa.length > 4) {
      errors.manganh = "Mã ngành chỉ được từ 1-4 ký tự";
    } else if (trimmedMa.length > 1 && !parentGroup) {
      errors.manganh = "Không có nhóm ngành cha";
    }

    if (!trimmedTen) {
      errors.tennganh = "Vui lòng nhập tên ngành nghề";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check duplicate locally
    const duplicateMa = allBusinessLines.find(
      (item) => item.manganh.toLowerCase() === trimmedMa.toLowerCase() && item.id !== editId
    );
    if (duplicateMa) {
      setFormErrors({ manganh: "Mã ngành đã tồn tại" });
      return;
    }

    const duplicateTen = allBusinessLines.find(
      (item) => item.tennganh.toLowerCase() === trimmedTen.toLowerCase() && item.id !== editId
    );
    if (duplicateTen) {
      setFormErrors({ tennganh: "Tên ngành nghề đã tồn tại" });
      return;
    }

    setLoading(true);
    try {
      setFormErrors({});
      const submitForm = {
        ...form,
        manganh: trimmedMa,
        tennganh: trimmedTen,
        cap: trimmedMa.length,
      };

      if (editId) {
        await businessLineService.update(editId, submitForm);
        enqueueSnackbar("Cập nhật ngành nghề thành công", { variant: "success" });
      } else {
        await businessLineService.create(submitForm);
        enqueueSnackbar("Thêm mới ngành nghề thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
      fetchAllBusinessLines();
    } catch (err: any) {
      console.error("Error saving business line", err);
      const getErrorMessage = (e: any, defaultMsg: string) => {
        if (e?.response?.data) {
          const resData = e.response.data;
          if (resData.errors) {
            if (typeof resData.errors === "string") return resData.errors;
            if (typeof resData.errors === "object" && resData.errors.message) return resData.errors.message;
          }
          if (resData.message) {
            return Array.isArray(resData.message) ? resData.message[0] : resData.message;
          }
        }
        return e?.message || defaultMsg;
      };
      enqueueSnackbar(getErrorMessage(err, "Lỗi khi lưu thông tin"), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = useCallback(async (item: BusinessLine) => {
    const previousStatus = item.trangthai;
    const nextStatus = previousStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // Optimistic UI update
    setData((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, trangthai: nextStatus } : row
      )
    );

    try {
      await businessLineService.update(item.id, { ...item, trangthai: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái thành công.", { variant: "success" });
      fetchList();
      fetchAllBusinessLines();
    } catch (error: unknown) {
      // Rollback UI on failure
      setData((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, trangthai: previousStatus } : row
        )
      );

      // Extract error message from backend response
      let errorMessage = "Cập nhật trạng thái thất bại.";

      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<{
          message?: string | string[];
          error?: string;
          errors?: { message?: string | string[] } | string;
        }>;
        const responseData = axiosErr.response?.data;

        if (responseData) {
          // Priority 1: errors.message (from custom ServiceErrorsFilter)
          if (responseData.errors) {
            if (typeof responseData.errors === "string") {
              errorMessage = responseData.errors;
            } else if (
              typeof responseData.errors === "object" &&
              responseData.errors.message
            ) {
              const errMsg = responseData.errors.message;
              errorMessage = Array.isArray(errMsg) ? errMsg[0] : errMsg;
            }
          }
          // Priority 2: response.data.message (string or array)
          else if (responseData.message) {
            errorMessage = Array.isArray(responseData.message)
              ? responseData.message[0]
              : responseData.message;
          }
          // Priority 3: response.data.error
          else if (responseData.error) {
            errorMessage = responseData.error;
          }
        }

        // Debug logging only in development
        if (process.env.NODE_ENV === "development") {
          console.debug("[BusinessLine Status Toggle] Debug Info:", {
            httpStatus: axiosErr.response?.status,
            responseBody: responseData,
            requestUrl: axiosErr.config?.url,
            requestPayload: axiosErr.config?.data,
          });
        }
      }

      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  }, [enqueueSnackbar]);

  const isAllSelected = data.length > 0 && data.every((item) => selectedIds.includes(String(item.id)));
  const isIndeterminate = !isAllSelected && data.some((item) => selectedIds.includes(String(item.id)));

  const startIndex = useMemo(() => {
    if (total === 0) return 0;
    return (filters.page - 1) * filters.limit + 1;
  }, [filters.page, filters.limit, total]);

  const endIndex = useMemo(() => {
    return Math.min(total, filters.page * filters.limit);
  }, [filters.page, filters.limit, total]);

  return (
    <Box className={classes.root}>
      {/* Header */}
      <Box className={classes.pageHeader}>
        <Typography className={classes.headerTitle}>Danh sách ngành nghề kinh doanh</Typography>
        <Box className={classes.actions}>
          {hasPermission('ADMIN_C_NGANH_NGHE_KD_CREATE') && (
            <>
              <Button
                className={classes.importBtn}
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => enqueueSnackbar("Chức năng đang được phát triển", { variant: "info" })}
              >
                Thêm từ file
              </Button>
              <Button
                className={classes.addBtn}
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
              >
                Thêm mới
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box className={classes.mainContent} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box className={classes.card} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Box className={classes.tableScroll} sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  {/* Table Header Row */}
                  <TableRow>
                    <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                      {hasPermission('ADMIN_C_NGANH_NGHE_KD_DELETE') && (
                        <Checkbox
                          size="small"
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={handleSelectAll}
                        />
                      )}
                    </TableCell>
                    <TableCell className={classes.headerCell} width={80} align="center">Thao tác</TableCell>
                    <TableCell className={classes.headerCell} width={150}>Mã ngành</TableCell>
                    <TableCell className={classes.headerCell}>Tên ngành nghề</TableCell>
                    <TableCell className={classes.headerCell} width={150}>Cấp</TableCell>
                    <TableCell className={classes.headerCell} width={180}>Trạng thái</TableCell>
                  </TableRow>

                  {/* Filter Inline Row - matching screenshot empty look */}
                  <TableRow>
                    <TableCell className={classes.filterCell}></TableCell>
                    <TableCell className={classes.filterCell}></TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        placeholder="Mã ngành"
                        value={filters.manganh}
                        onChange={(e) => handleFilterChange("manganh", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        placeholder="Tên ngành nghề"
                        value={filters.tennganh}
                        onChange={(e) => handleFilterChange("tennganh", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        placeholder="Cấp"
                        value={filters.cap}
                        onChange={(e) => handleFilterChange("cap", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <Autocomplete
                        size="small"
                        options={[
                          { label: 'Hoạt động', value: 'ACTIVE' },
                          { label: 'Ngưng hoạt động', value: 'INACTIVE' }
                        ]}
                        getOptionLabel={(option) => option.label || ""}
                        value={[
                          { label: 'Hoạt động', value: 'ACTIVE' },
                          { label: 'Ngưng hoạt động', value: 'INACTIVE' }
                        ].find((o) => o.value === filters.trangthai) || null}
                        onChange={(_, newValue) => handleFilterChange("trangthai", newValue?.value || "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Tất cả"
                            className={classes.filterField}
                          />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#94a3b8" }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id} hover selected={selectedIds.includes(String(item.id))}>
                        <TableCell padding="checkbox" className={classes.bodyCell}>
                          {hasPermission('ADMIN_C_NGANH_NGHE_KD_DELETE') && (
                            <Checkbox
                              size="small"
                              checked={selectedIds.includes(String(item.id))}
                              onChange={() => handleSelectOne(String(item.id))}
                            />
                          )}
                        </TableCell>
                        <TableCell className={classes.bodyCell} align="center">
                          {hasPermission('ADMIN_C_NGANH_NGHE_KD_UPDATE') && (
                            <IconButton
                              className={classes.actionIcon}
                              onClick={() => handleOpenEdit(item)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell className={classes.bodyCell}>{item.manganh}</TableCell>
                        <TableCell className={classes.bodyCell}>{getDashPrefix(item.cap)}{item.tennganh}</TableCell>
                        <TableCell className={classes.bodyCell}>Cấp {item.cap}</TableCell>
                        <TableCell className={classes.bodyCell}>
                          <Switch
                            size="small"
                            checked={item.trangthai === "ACTIVE"}
                            disabled={!hasPermission('ADMIN_C_NGANH_NGHE_KD_UPDATE')}
                            onChange={() => handleStatusToggle(item)}
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Pagination Footer */}
          <Box className={classes.footer}>
            <Select
              size="small"
              value={filters.limit}
              onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
              className={classes.pageSizeSelect}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
            <Typography className={classes.pageInfo}>
              {startIndex} - {endIndex} of {total}
            </Typography>
            <CustomPagination
              count={Math.max(1, Math.ceil(total / filters.limit))}
              page={filters.page}
              onChange={(p) => handleFilterChange("page", p)}
            />
          </Box>
        </Box>
      </Box>

      {/* Bulk Selection Actions */}
      {selectedIds.length > 0 && hasPermission('ADMIN_C_NGANH_NGHE_KD_DELETE') && (
        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={() => setConfirmBulkDeleteOpen(true)}
          onClose={() => setSelectedIds([])}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} ngành nghề kinh doanh đã chọn?`}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleDeleteMany}
        confirmText="Xóa"
      />

      {/* Create/Edit Modal Dialog */}
      {/* Create/Edit Modal Dialog */}
      <DialogAny
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e293b' }}>
            {editId ? "Chỉnh sửa ngành nghề" : "Thêm mới ngành nghề"}
          </Typography>
          <IconButton size="small" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 3 }}>
            <TextFieldAny
              fullWidth
              size="small"
              label="Mã ngành *"
              placeholder="Nhập mã ngành"
              value={form.manganh}
              onChange={(e: any) => handleMaNganhChange(e.target.value)}
              disabled={editId !== null}
              error={!!formErrors.manganh}
              helperText={formErrors.manganh}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                  "&.Mui-disabled fieldset": { borderColor: "#eef0f4" },
                },
              }}
            />

            <TextFieldAny
              fullWidth
              size="small"
              label="Tên ngành *"
              placeholder="Nhập tên ngành"
              value={form.tennganh}
              onChange={(e: any) => {
                setForm({ ...form, tennganh: e.target.value });
                if (formErrors.tennganh) setFormErrors({ ...formErrors, tennganh: "" });
              }}
              error={!!formErrors.tennganh}
              helperText={formErrors.tennganh}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                },
              }}
            />

            <AutocompleteAny
              size="small"
              options={parentGroup ? [parentGroup] : []}
              getOptionLabel={(option: any) => `${option.manganh} - ${option.tennganh}`}
              value={parentGroup}
              disabled={editId !== null || form.manganh.trim().length <= 1}
              renderInput={(params: any) => (
                <TextFieldAny
                  {...params}
                  label="Nhóm ngành cha"
                  error={parentNotFound}
                  helperText={parentNotFound ? "Không có nhóm ngành cha" : ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      "& fieldset": { borderColor: "#dfe3eb" },
                      "&:hover fieldset": { borderColor: "#bcc4d3" },
                      "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                    },
                    "& .MuiFormHelperText-root": {
                      color: "red !important",
                    }
                  }}
                />
              )}
            />

            <TextFieldAny
              fullWidth
              select
              size="small"
              label="Trạng thái *"
              value={form.trangthai}
              onChange={(e: any) => setForm({ ...form, trangthai: e.target.value })}
              slotProps={{ 
                inputLabel: { shrink: true },
                select: {
                  MenuProps: { PaperProps: { sx: { borderRadius: "8px" } } }
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                },
              }}
            >
              <MenuItem value="ACTIVE">Sử dụng</MenuItem>
              <MenuItem value="INACTIVE">Ngưng sử dụng</MenuItem>
            </TextFieldAny>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              color: '#666',
              border: '1px solid #dfe3eb',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': {
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#2f65f0",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#1e4fd1",
              },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </DialogAny>
    </Box>
  );
};
