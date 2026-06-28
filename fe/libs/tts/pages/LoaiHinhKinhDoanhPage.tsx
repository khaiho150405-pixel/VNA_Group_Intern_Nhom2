"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Switch,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";

import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";

import { loaiHinhKinhDoanhService } from "@tts/services";

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
    borderBottom: "1px solid #eef0f4",
    padding: "12px 16px",
    whiteSpace: "nowrap",
  },
  filterCell: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #eef0f4",
    padding: "8px 12px",
    position: "sticky !important" as any,
    top: "45px !important",
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

interface LoaiHinhKinhDoanh {
  id: number;
  maloaihinh: string;
  tenloaihinh: string;
  trangthai: string;
}

export const LoaiHinhKinhDoanhPage = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LoaiHinhKinhDoanh[]>([]);
  const [total, setTotal] = useState(0);

  // Filters State
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 10,
    maloaihinh: "",
    tenloaihinh: "",
  });

  // Bulk Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LoaiHinhKinhDoanh | null>(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    maloaihinh: "",
    tenloaihinh: "",
    trangthai: "ACTIVE",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchList = async () => {
    setLoading(true);
    try {
      const where: any = {};
      if (filters.maloaihinh) where.maloaihinh = { operation: "like", value: `%${filters.maloaihinh}%` };
      if (filters.tenloaihinh) where.tenloaihinh = { operation: "like", value: `%${filters.tenloaihinh}%` };
      if (filters.trangthai) where.trangthai = { operation: "=", value: filters.trangthai };

      const params = {
        pageNumber: filters.page - 1,
        pageSize: filters.limit,
        where: JSON.stringify(where)
      };

      const res: any = await loaiHinhKinhDoanhService.getAll(params);
      const items = res?.data?.items || res?.items || [];
      const totalCount = res?.data?.count ?? res?.count ?? 0;
      setData(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching loai hinh kinh doanh list", err);
      enqueueSnackbar("Lỗi khi tải danh sách loại hình kinh doanh", { variant: "error" });
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
      await loaiHinhKinhDoanhService.deleteMany(selectedIds.map(Number));
      enqueueSnackbar("Xóa các loại hình kinh doanh thành công", { variant: "success" });
      setSelectedIds([]);
      fetchList();
    } catch (err: any) {
      console.error("Error bulk deleting", err);
      enqueueSnackbar(err?.response?.data?.message || "Lỗi khi xóa", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      maloaihinh: "",
      tenloaihinh: "",
      trangthai: "ACTIVE",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: LoaiHinhKinhDoanh) => {
    setEditId(item.id);
    setForm({
      maloaihinh: item.maloaihinh,
      tenloaihinh: item.tenloaihinh,
      trangthai: item.trangthai,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!form.maloaihinh || form.maloaihinh.trim() === "") {
      errors.maloaihinh = "Vui lòng nhập mã loại hình";
    }
    if (!form.tenloaihinh || form.tenloaihinh.trim() === "") {
      errors.tenloaihinh = "Vui lòng nhập tên loại hình";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate maloaihinh
      const checkMaRes: any = await loaiHinhKinhDoanhService.getAll({
        where: JSON.stringify({ maloaihinh: { operation: "=", value: form.maloaihinh } })
      });
      const checkMaItems = checkMaRes?.data?.items || checkMaRes?.items || [];
      const duplicateMa = checkMaItems.find((item: any) => item.maloaihinh.toLowerCase() === form.maloaihinh.toLowerCase() && item.id !== editId);

      if (duplicateMa) {
        setFormErrors({ maloaihinh: "Mã loại hình đã tồn tại" });
        setLoading(false);
        return;
      }

      // Check for duplicate tenloaihinh
      const checkTenRes: any = await loaiHinhKinhDoanhService.getAll({
        where: JSON.stringify({ tenloaihinh: { operation: "=", value: form.tenloaihinh } })
      });
      const checkTenItems = checkTenRes?.data?.items || checkTenRes?.items || [];
      const duplicateTen = checkTenItems.find((item: any) => item.tenloaihinh.toLowerCase() === form.tenloaihinh.toLowerCase() && item.id !== editId);

      if (duplicateTen) {
        setFormErrors({ tenloaihinh: "Tên loại hình kinh doanh đã tồn tại" });
        setLoading(false);
        return;
      }

      setFormErrors({});

      if (editId) {
        await loaiHinhKinhDoanhService.update(editId, form);
        enqueueSnackbar("Cập nhật loại hình kinh doanh thành công", { variant: "success" });
      } else {
        await loaiHinhKinhDoanhService.create(form);
        enqueueSnackbar("Thêm mới loại hình kinh doanh thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
    } catch (err: any) {
      console.error("Error saving loai hinh kinh doanh", err);
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

  const handleStatusToggle = async (item: LoaiHinhKinhDoanh) => {
    const nextStatus = item.trangthai === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await loaiHinhKinhDoanhService.update(item.id, { ...item, trangthai: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
      fetchList();
    } catch (err: any) {
      console.error("Error updating status", err);
      enqueueSnackbar("Lỗi khi cập nhật trạng thái", { variant: "error" });
    }
  };

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
        <Typography className={classes.headerTitle}>Danh sách loại hình kinh doanh</Typography>
        <Box className={classes.actions}>
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
        </Box>
      </Box>

      {/* Content */}
      <Box className={classes.mainContent}>
        <Box className={classes.card}>
          <TableContainer className={classes.tableScroll}>
            <Table stickyHeader size="small">
              <TableHead>
                {/* Table Header Row */}
                <TableRow>
                  <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell className={classes.headerCell} width={80} align="center">Thao tác</TableCell>
                  <TableCell className={classes.headerCell} width={150}>Mã loại hình</TableCell>
                  <TableCell className={classes.headerCell}>Tên loại hình</TableCell>
                  <TableCell className={classes.headerCell} width={150}>Trạng thái</TableCell>
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
                      placeholder="Mã loại hình"
                      value={filters.maloaihinh}
                      onChange={(e) => handleFilterChange("maloaihinh", e.target.value)}
                    />
                  </TableCell>
                  <TableCell className={classes.filterCell}>
                    <TextField
                      className={classes.filterField}
                      size="small"
                      fullWidth
                      placeholder="Tên loại hình"
                      value={filters.tenloaihinh}
                      onChange={(e) => handleFilterChange("tenloaihinh", e.target.value)}
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
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#94a3b8" }}>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id} hover selected={selectedIds.includes(String(item.id))}>
                      <TableCell padding="checkbox" className={classes.bodyCell}>
                        <Checkbox
                          size="small"
                          checked={selectedIds.includes(String(item.id))}
                          onChange={() => handleSelectOne(String(item.id))}
                        />
                      </TableCell>
                      <TableCell className={classes.bodyCell} align="center">
                        <IconButton
                          className={classes.actionIcon}
                          onClick={() => handleOpenEdit(item)}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell className={classes.bodyCell}>{item.maloaihinh}</TableCell>
                      <TableCell className={classes.bodyCell}>{item.tenloaihinh}</TableCell>
                      <TableCell className={classes.bodyCell}>
                        <Switch
                          size="small"
                          checked={item.trangthai === "ACTIVE"}
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
            <Pagination
              count={Math.max(1, Math.ceil(total / filters.limit))}
              page={filters.page}
              onChange={(_, p) => handleFilterChange("page", p)}
              shape="rounded"
              size="small"
              siblingCount={0}
              boundaryCount={1}
            />
          </Box>
        </Box>
      </Box>

      {/* Bulk Selection Actions */}
      {selectedIds.length > 0 && (
        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={() => setConfirmBulkDeleteOpen(true)}
          onClose={() => setSelectedIds([])}
        />
      )}

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} loại hình kinh doanh đã chọn?`}
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleDeleteMany}
        confirmText="Xóa"
      />

      {/* Create/Edit Modal Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#2f65f0",
          }}
        >
          {editId ? "Cập nhật loại hình kinh doanh" : "Thêm mới loại hình kinh doanh"}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: "#fff",
              "&:hover": { color: "#e2e8f0", backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: "#eef0f4" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#333", mb: 0.5 }}>
                Mã loại hình <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập mã loại hình"
                value={form.maloaihinh}
                onChange={(e) => {
                  setForm({ ...form, maloaihinh: e.target.value });
                  if (formErrors.maloaihinh) setFormErrors({ ...formErrors, maloaihinh: "" });
                }}
                error={!!formErrors.maloaihinh}
                helperText={formErrors.maloaihinh}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    "& fieldset": { borderColor: "#dfe3eb" },
                    "&:hover fieldset": { borderColor: "#bcc4d3" },
                    "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#333", mb: 0.5 }}>
                Tên loại hình kinh doanh <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập tên loại hình kinh doanh"
                value={form.tenloaihinh}
                onChange={(e) => {
                  setForm({ ...form, tenloaihinh: e.target.value });
                  if (formErrors.tenloaihinh) setFormErrors({ ...formErrors, tenloaihinh: "" });
                }}
                error={!!formErrors.tenloaihinh}
                helperText={formErrors.tenloaihinh}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    "& fieldset": { borderColor: "#dfe3eb" },
                    "&:hover fieldset": { borderColor: "#bcc4d3" },
                    "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: "#333", mb: 0.5 }}>
                Trạng thái
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.trangthai}
                onChange={(e) => setForm({ ...form, trangthai: e.target.value })}
                sx={{
                  borderRadius: 1,
                  "& fieldset": { borderColor: "#dfe3eb" },
                  "&:hover fieldset": { borderColor: "#bcc4d3" },
                  "&.Mui-focused fieldset": { borderColor: "#2f65f0" },
                }}
              >
                <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                <MenuItem value="INACTIVE">Ngưng hoạt động</MenuItem>
              </Select>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, pt: 2, pb: 2.5 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: "#5a6478",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#f3f5f9" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            variant="contained"
            sx={{
              backgroundColor: "#2f65f0",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderRadius: 1,
              boxShadow: "0px 4px 10px rgba(47, 101, 240, 0.2)",
              "&:hover": {
                backgroundColor: "#1e4fd1",
                boxShadow: "0px 6px 14px rgba(47, 101, 240, 0.3)",
              },
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
