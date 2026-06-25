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
  Grid,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";

import { MainLayout } from "@core/layouts/MainLayout";
import { reportPeriodService } from "@tts/services";

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
    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
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
  addBtn: {
    backgroundColor: "#2f65f0",
    color: "#fff",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
    padding: theme.spacing(0.6, 2),
    borderRadius: 6,
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#1e4fd1",
      boxShadow: "none",
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
    boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
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
    position: "sticky",
    top: 45,
    zIndex: 2,
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

interface PeriodConfig {
  id: number;
  year: number;
  reportName: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
}

export const ReportPeriodPage = () => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PeriodConfig[]>([]);
  const [total, setTotal] = useState(0);

  const years = useMemo(() => {
    const arr = [];
    const current = new Date().getFullYear();
    for (let y = current + 5; y >= 2000; y--) {
      arr.push(y);
    }
    return arr;
  }, []);

  // Filters State
  const [filters, setFilters] = useState({
    year: "",
    reportName: "",
    period: "",
    startDate: "",
    endDate: "",
    status: "",
    page: 1,
    limit: 10,
  });

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    reportName: "Báo cáo tai nạn lao động",
    year: "",
    period: "CA_NAM",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  });

  const fetchList = async () => {
    setLoading(true);
    try {
      const res: any = await reportPeriodService.getAll(filters);
      const items = res?.data?.items || res?.items || [];
      const totalCount = res?.data?.totalCount ?? res?.totalCount ?? 0;
      setData(items);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching configs list", err);
      enqueueSnackbar("Lỗi khi tải danh sách cấu hình kỳ báo cáo", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters]);

  const handleFilterChange = (field: string, val: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: val,
      page: field === "page" ? val : 1, // reset page to 1 on other filter changes
    }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      reportName: "Báo cáo tai nạn lao động",
      year: "",
      period: "CA_NAM",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: PeriodConfig) => {
    setEditId(item.id);
    setForm({
      reportName: item.reportName,
      year: String(item.year),
      period: item.period,
      startDate: formatDateForForm(item.startDate),
      endDate: formatDateForForm(item.endDate),
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!form.year || !form.reportName || !form.period || !form.startDate || !form.endDate) {
      enqueueSnackbar("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", { variant: "warning" });
      return;
    }
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) {
      enqueueSnackbar("Ngày kết thúc không được nhỏ hơn ngày bắt đầu", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await reportPeriodService.update(editId, form);
        enqueueSnackbar("Cập nhật cấu hình kỳ báo cáo thành công", { variant: "success" });
      } else {
        await reportPeriodService.create(form);
        enqueueSnackbar("Thêm mới cấu hình kỳ báo cáo thành công", { variant: "success" });
      }
      setDialogOpen(false);
      fetchList();
    } catch (err: any) {
      console.error("Error saving period config", err);
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Lỗi khi lưu cấu hình", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (item: PeriodConfig) => {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await reportPeriodService.update(item.id, { status: nextStatus });
      enqueueSnackbar("Cập nhật trạng thái kỳ báo cáo thành công", { variant: "success" });
      fetchList();
    } catch (err) {
      console.error("Error updating status config", err);
      enqueueSnackbar("Lỗi khi cập nhật trạng thái", { variant: "error" });
    }
  };

  // Helper date formatting
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  function formatDateForForm(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  const startIndex = useMemo(() => {
    if (total === 0) return 0;
    return (filters.page - 1) * filters.limit + 1;
  }, [filters.page, filters.limit, total]);

  const endIndex = useMemo(() => {
    return Math.min(total, filters.page * filters.limit);
  }, [filters.page, filters.limit, total]);

  return (
    <MainLayout>
      <Box className={classes.root}>
        {/* Header */}
        <Box className={classes.pageHeader}>
          <Typography className={classes.headerTitle}>Danh sách cấu hình báo cáo</Typography>
          <Box className={classes.actions}>
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
                    <TableCell className={classes.headerCell} width={100}>Thao tác</TableCell>
                    <TableCell className={classes.headerCell} width={120}>Năm báo cáo</TableCell>
                    <TableCell className={classes.headerCell}>Tên báo cáo</TableCell>
                    <TableCell className={classes.headerCell} width={180}>Kỳ báo cáo</TableCell>
                    <TableCell className={classes.headerCell} width={180}>Thời gian bắt đầu</TableCell>
                    <TableCell className={classes.headerCell} width={180}>Thời gian kết thúc</TableCell>
                    <TableCell className={classes.headerCell} width={150}>Trạng thái</TableCell>
                  </TableRow>

                  {/* Filter Inline Row */}
                  <TableRow>
                    <TableCell className={classes.filterCell}></TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        value={filters.year}
                        onChange={(e) => handleFilterChange("year", e.target.value.replace(/[^0-9]/g, ""))}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <Select
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        displayEmpty
                        value={filters.reportName}
                        onChange={(e) => handleFilterChange("reportName", e.target.value)}
                        sx={{ height: 32 }}
                      >
                        <MenuItem value="">-- Tất cả --</MenuItem>
                        <MenuItem value="Báo cáo tai nạn lao động">Báo cáo tai nạn lao động</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <Select
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        displayEmpty
                        value={filters.period}
                        onChange={(e) => handleFilterChange("period", e.target.value)}
                        sx={{ height: 32 }}
                      >
                        <MenuItem value="">-- Tất cả --</MenuItem>
                        <MenuItem value="CA_NAM">Cả năm</MenuItem>
                        <MenuItem value="6_THANG">6 tháng</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange("startDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <TextField
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange("endDate", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={classes.filterCell}>
                      <Select
                        className={classes.filterField}
                        size="small"
                        fullWidth
                        displayEmpty
                        value={filters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        sx={{ height: 32 }}
                      >
                        <MenuItem value="">-- Tất cả --</MenuItem>
                        <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                        <MenuItem value="INACTIVE">Ngừng hoạt động</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#94a3b8" }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell className={classes.bodyCell}>
                          <IconButton
                            className={classes.actionIcon}
                            onClick={() => handleOpenEdit(item)}
                          >
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </TableCell>
                        <TableCell className={classes.bodyCell}>{item.year}</TableCell>
                        <TableCell className={classes.bodyCell}>{item.reportName}</TableCell>
                        <TableCell className={classes.bodyCell}>
                          {item.period === "CA_NAM" ? "Cả năm" : "6 tháng"}
                        </TableCell>
                        <TableCell className={classes.bodyCell}>{formatDate(item.startDate)}</TableCell>
                        <TableCell className={classes.bodyCell}>{formatDate(item.endDate)}</TableCell>
                        <TableCell className={classes.bodyCell}>
                          <Switch
                            size="small"
                            checked={item.status === "ACTIVE"}
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

        {/* Create/Edit Modal Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
              {editId ? "Chỉnh sửa" : "Thêm mới cấu hình"}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ py: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tên báo cáo *"
                  value={form.reportName}
                  onChange={(e) => setForm({ ...form, reportName: e.target.value })}
                >
                  <MenuItem value="Báo cáo tai nạn lao động">Báo cáo tai nạn lao động</MenuItem>
                  <MenuItem value="Báo cáo TNLĐ">Báo cáo TNLĐ</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  fullWidth
                  options={years.map(String)}
                  value={form.year}
                  onChange={(_, newValue) => {
                    const yearVal = (newValue || "").replace(/[^0-9]/g, "");
                    const updatedForm = {
                      ...form,
                      year: yearVal,
                      startDate: yearVal ? `${yearVal}-01-01` : "",
                      endDate: yearVal ? `${yearVal}-12-31` : ""
                    };
                    setForm(updatedForm);
                  }}
                  onInputChange={(_, newInputValue) => {
                    const yearVal = newInputValue.replace(/[^0-9]/g, "");
                    setForm((prev) => {
                      const updated = {
                        ...prev,
                        year: yearVal
                      };
                      if (yearVal.length === 4) {
                        updated.startDate = `${yearVal}-01-01`;
                        updated.endDate = `${yearVal}-12-31`;
                      }
                      return updated;
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Năm *"
                      placeholder="Chọn hoặc nhập năm..."
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Kỳ báo cáo *"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                >
                  <MenuItem value="CA_NAM">Cả năm</MenuItem>
                  <MenuItem value="6_THANG">6 tháng</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Ngày bắt đầu *"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={form.startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updatedForm = { ...form, startDate: val };
                    if (val) {
                      const yearMatch = val.match(/^(\d{4})/);
                      if (yearMatch) {
                        updatedForm.year = yearMatch[1];
                      }
                    }
                    setForm(updatedForm);
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Ngày kết thúc *"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={form.endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updatedForm = { ...form, endDate: val };
                    if (val) {
                      const yearMatch = val.match(/^(\d{4})/);
                      if (yearMatch) {
                        updatedForm.year = yearMatch[1];
                      }
                    }
                    setForm(updatedForm);
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Trạng thái"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <MenuItem value="ACTIVE">Hoạt động</MenuItem>
                  <MenuItem value="INACTIVE">Ngừng hoạt động</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{ backgroundColor: "#2f65f0", textTransform: "none", fontWeight: 600 }}
            >
              Lưu
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};
