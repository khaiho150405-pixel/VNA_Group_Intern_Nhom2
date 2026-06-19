"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Checkbox,
  IconButton,
  TextField,
  MenuItem,
  Select,
  Switch,
  Pagination,
  Tooltip,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Add as AddIcon,
  FileUpload as UploadIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";

import { MainLayout } from "@core/layouts/MainLayout";
import { BulkSelectionBar } from "@core/components/BulkSelectionBar";
import { DoetService } from "@tts/services";
import { ResetPasswordModal } from "@tts/components/ResetPasswordModal";
import {
  Doet,
  DoetFilters,
  LoaiHinhKinhDoanh,
  BusinessLine,
} from "@shared/tts/models";
import { useEnterpriseListStyles } from "../logic/enterprise/style";
import { ConfirmDialog } from "@core/components/ConfirmDialog";
import { useAuth } from "@core/contexts/AuthProvider";
import { normalizeListResponse } from "@core/utils/helper";

interface WardOption {
  key: string;
  value: string;
}

export const EnterpriseListPage = () => {
  const classes = useEnterpriseListStyles();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const isReadOnly = useMemo(() => {
    if (!user) return true;
    const roleType = (user as any)?.role?.type;
    const roleId = (user as any)?.roleId || (user as any)?.role?.id;
    const realRole = (user as any)?.realRole || '';
    
    // Đối với nhóm Sở: Nhân viên và Chuyên viên chỉ có quyền xem
    if (roleType === 'SO') {
      const isRestricted = roleId === 1 || roleId === 2 || 
                          realRole.includes('Nhân viên') || realRole.includes('Chuyên viên') ||
                          realRole.includes('Employee') || realRole.includes('Expert');
      
      const roleName = (user as any)?.role?.name?.toUpperCase() || '';
      const isAdminOrLeader = roleName.includes('ADMIN') || roleName.includes('QUẢN TRỊ') || 
                              roleName.includes('LÃNH ĐẠO') || roleName.includes('LEADER');

      return isRestricted && !isAdminOrLeader;
    }
    
    // Đối với nhóm Doanh nghiệp: Không được phép quản lý danh sách doanh nghiệp chung
    if (roleType === 'DN') return true;

    return false;
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Doet[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<DoetFilters>({
    page: 1,
    limit: 10,
    name: "",
    taxCode: "",
    status: "",
  });

  const [loaiHinhs, setLoaiHinhs] = useState<LoaiHinhKinhDoanh[]>([]);
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [resetModal, setResetModal] = useState<{
    open: boolean;
    id: number | null;
    name: string;
  }>({ open: false, id: null, name: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await DoetService.getList(filters);
      const items = normalizeListResponse(res);
      const totalCount =
        (res as any)?.total ??
        (res as any)?.data?.total ??
        (res as any)?.data?.count ??
        items.length;
      setData(items);
      setTotal(Number(totalCount) || 0);
    } catch (error) {
      enqueueSnackbar("Lỗi khi tải dữ liệu doanh nghiệp", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [lh, bl, w] = await Promise.all([
        DoetService.getLoaiHinhKinhDoanh(),
        DoetService.getBusinessLines(),
        DoetService.getDistinctWards(),
      ]);
      setLoaiHinhs(normalizeListResponse(lh));
      setBusinessLines(normalizeListResponse(bl));
      setWards(normalizeListResponse(w));
    } catch (error) {
      console.error("Error fetching dropdowns", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const handleFilterChange = (field: keyof DoetFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === "page" || field === "limit" ? prev.page : 1,
    }));
    if (field !== "page" && field !== "limit") setSelectedIds([]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(data.map((d) => d.id!));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      // Optimistic update
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as any } : item,
        ),
      );

      await DoetService.update(id, { status: newStatus as any });
      enqueueSnackbar("Cập nhật trạng thái thành công", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Lỗi khi cập nhật trạng thái", { variant: "error" });
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    try {
      await DoetService.deleteMany(selectedIds);
      enqueueSnackbar("Xoá thành công", { variant: "success" });
      setSelectedIds([]);
      setConfirmDeleteOpen(false);
      fetchData();
    } catch (error) {
      enqueueSnackbar("Lỗi khi xoá dữ liệu", { variant: "error" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const res: any = await DoetService.importExcel(file);
      const items = res?.data || res || [];

      if (!Array.isArray(items) || items.length === 0) {
        enqueueSnackbar('Không tìm thấy dữ liệu trong file', { variant: 'warning' });
        return;
      }

      if (items.length === 1) {
        sessionStorage.setItem('pending_import_doet', JSON.stringify(items[0]));
        router.push('/doets/create?mode=import');
      } else {
        await Promise.all(items.map(item => DoetService.create(item)));
        enqueueSnackbar(`Đã thêm ${items.length} doanh nghiệp thành công`, { variant: 'success' });
        fetchData();
      }
    } catch (error) {
      enqueueSnackbar('Lỗi khi xử lý file', { variant: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startIndex = useMemo(
    () => (total === 0 ? 0 : (filters.limit || 10) * ((filters.page || 1) - 1) + 1),
    [filters, total],
  );
  const endIndex = useMemo(
    () => Math.min((filters.limit || 10) * (filters.page || 1), total),
    [filters, total],
  );

  const isAllSelected =
    data.length > 0 && selectedIds.length === data.length;
  const isIndeterminate =
    selectedIds.length > 0 && selectedIds.length < data.length;

  // Cấu hình các cột của bảng để dễ dàng chỉnh sửa độ rộng và thuộc tính
  const columns = [
    { id: 'name', label: 'Tên doanh nghiệp', width: '20%', minWidth: 150 },
    { id: 'taxCode', label: 'Mã số thuế', width: '12%', minWidth: 120 },
    { id: 'loaiHinh', label: 'Loại hình kinh doanh', width: '10%', minWidth: 120 },
    { id: 'businessLine', label: 'Ngành nghề kinh doanh', width: '20%', minWidth: 180 },
    { id: 'ward', label: 'Phường/ xã', width: '12%', minWidth: 120 },
    { id: 'status', label: 'Trạng thái', width: '10%', minWidth: 100, align: 'center' as const },
  ];

  return (
    <MainLayout>
      <Box className={classes.root}>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept=".xlsx, .xls"
          onChange={handleImport}
        />
        <Box className={classes.pageHeader}>
          <Typography className={classes.headerTitle}>
            Danh sách doanh nghiệp
          </Typography>
          <Box className={classes.actions}>
            {!isReadOnly && (
              <>
                <Button
                  className={classes.importBtn}
                  startIcon={<UploadIcon fontSize="small" />}
                  disableRipple
                  onClick={() => fileInputRef.current?.click()}
                >
                  Thêm từ file
                </Button>
                <Button
                  variant="contained"
                  className={classes.addBtn}
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => router.push("/doets/create")}
                >
                  Thêm mới
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box className={classes.mainContent}>
          <Box className={classes.card}>
            <Box className={classes.tableScroll}>
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" className={classes.headerCell} width={50}>
                        {!isReadOnly && (
                          <Checkbox
                            size="small"
                            indeterminate={isIndeterminate}
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                        )}
                      </TableCell>
                      <TableCell className={classes.headerCell} width={100}>Thao tác</TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.id}
                          className={classes.headerCell}
                          align={col.align}
                          sx={{ width: col.width, minWidth: col.minWidth }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tìm kiếm..."
                          className={classes.filterField}
                          value={filters.name || ""}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tìm kiếm..."
                          className={classes.filterField}
                          value={filters.taxCode || ""}
                          onChange={(e) => handleFilterChange("taxCode", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(loaiHinhs) ? loaiHinhs : []}
                          getOptionLabel={(option) => option.tenloaihinh || ""}
                          value={loaiHinhs.find(lh => lh.id === filters.loaiHinhId) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("loaiHinhId", newValue?.id)
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                          )}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(businessLines) ? businessLines : []}
                          getOptionLabel={(option) => option ? `${option.manganh} - ${option.tennganh}` : ""}
                          value={businessLines.find(bl => bl.id === filters.businessLineId) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("businessLineId", newValue?.id)
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                          )}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={Array.isArray(wards) ? wards : []}
                          getOptionLabel={(option: WardOption) => option.value || ""}
                          isOptionEqualToValue={(opt: WardOption, val: WardOption) => opt.key === val.key}
                          value={wards.find((w: WardOption) => String(w.key) === filters.wardId) || null}
                          onChange={(_, newValue: WardOption | null) =>
                            handleFilterChange(
                              "wardId",
                              newValue?.key ? String(newValue.key) : undefined,
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Tất cả"
                              className={classes.filterField}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={[
                            { label: "Hoạt động", value: "ACTIVE" },
                            { label: "Ngưng hoạt động", value: "INACTIVE" }
                          ]}
                          getOptionLabel={(option) => option.label}
                          value={[
                            { label: "Hoạt động", value: "ACTIVE" },
                            { label: "Ngưng hoạt động", value: "INACTIVE" }
                          ].find(s => s.value === filters.status) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("status", newValue?.value)
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Tất cả" className={classes.filterField} />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={22} />
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((item) => {
                        const checked = selectedIds.includes(item.id!);
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            className={checked ? classes.rowSelected : ""}
                          >
                            <TableCell padding="checkbox" className={classes.bodyCell}>
                              {!isReadOnly && (
                                <Checkbox
                                  size="small"
                                  checked={checked}
                                  onChange={() => handleSelectOne(item.id!)}
                                />
                              )}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              <Box sx={{ display: "flex", gap: 0.25 }}>
                                <Tooltip title="Xem chi tiết">
                                  <IconButton
                                    size="small"
                                    className={classes.actionIcon}
                                    onClick={() => router.push(`/doets/${item.id}`)}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {!isReadOnly ? (
                                  <>
                                    <Tooltip title="Chỉnh sửa">
                                      <IconButton
                                        size="small"
                                        className={classes.actionIcon}
                                        onClick={() => router.push(`/doets/edit/${item.id}`)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cấp lại mật khẩu">
                                      <IconButton
                                        size="small"
                                        className={classes.actionIcon}
                                        onClick={() =>
                                          setResetModal({
                                            open: true,
                                            id: item.id!,
                                            name: item.taxCode || item.name,
                                          })
                                        }
                                      >
                                        <KeyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', ml: 1 }}>Chỉ xem</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell className={classes.bodyCell}>{item.name}</TableCell>
                            <TableCell className={classes.bodyCell}>{item.taxCode}</TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.loaiHinhKinhDoanh?.tenloaihinh || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.businessLine ? `${item.businessLine.manganh} - ${item.businessLine.tennganh}` : "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.ward?.value || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell} align="center">
                              <Switch
                                size="small"
                                disabled={isReadOnly}
                                checked={item.status === "ACTIVE"}
                                onChange={() => handleStatusChange(item.id!, item.status)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box className={classes.footer}>
              <Select
                size="small"
                value={filters.limit ?? 10}
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
                count={Math.max(1, Math.ceil(total / (filters.limit || 10)))}
                page={filters.page}
                onChange={(_, page) => handleFilterChange("page", page)}
                shape="rounded"
                size="small"
                siblingCount={0}
                boundaryCount={1}
              />
            </Box>
          </Box>
        </Box>

        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Xác nhận xóa"
          message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} doanh nghiệp đã chọn? Hành động này không thể hoàn tác.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
          confirmText="Xóa"
        />
        {!isReadOnly && (
          <BulkSelectionBar
            count={selectedIds.length}
            onDelete={() => setConfirmDeleteOpen(true)}
            onClose={() => setSelectedIds([])}
          />
        )}

        <ResetPasswordModal
          open={resetModal.open}
          onClose={() => setResetModal((prev) => ({ ...prev, open: false }))}
          enterpriseId={resetModal.id}
          enterpriseName={resetModal.name}
        />
      </Box>
    </MainLayout>
  );
};
