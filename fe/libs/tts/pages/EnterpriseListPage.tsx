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

interface WardOption {
  id: string;
  full_name?: string;
  name?: string;
}

const normalizeListResponse = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.items)) return raw.data.items;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
};

export const EnterpriseListPage = () => {
  const classes = useEnterpriseListStyles();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      const [lh, bl] = await Promise.all([
        DoetService.getLoaiHinhKinhDoanh(),
        DoetService.getBusinessLines(),
      ]);
      setLoaiHinhs(normalizeListResponse(lh));
      setBusinessLines(normalizeListResponse(bl));

      // Lấy danh sách phường/xã đã có trong dữ liệu doanh nghiệp (distinct)
      try {
        const wardRes: any = await DoetService.getDistinctWards();
        const wards = normalizeListResponse(wardRes).map((w: any) => ({
          id: w.key,
          name: w.value,
          full_name: w.value,
        }));
        setWards(wards);
      } catch (error) {
        console.error("Error fetching distinct wards", error);
        setWards([]);
      }
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
          </Box>
        </Box>

        <Box className={classes.mainContent}>
          <Box className={classes.card}>
            <Box className={classes.tableScroll}>
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" className={classes.headerCell}>
                        <Checkbox
                          size="small"
                          indeterminate={isIndeterminate}
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell className={classes.headerCell}>Thao tác</TableCell>
                      <TableCell className={classes.headerCell}>Tên doanh nghiệp</TableCell>
                      <TableCell className={classes.headerCell}>Mã số thuế</TableCell>
                      <TableCell className={classes.headerCell}>Loại hình kinh doanh</TableCell>
                      <TableCell className={classes.headerCell}>Ngành nghề kinh doanh</TableCell>
                      <TableCell className={classes.headerCell}>Phường/ xã</TableCell>
                      <TableCell className={classes.headerCell} align="center">Trạng thái</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          className={classes.filterField}
                          value={filters.name || ""}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
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
                          getOptionLabel={(option) => option.tennganh || ""}
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
                          getOptionLabel={(option: any) => option.full_name || option.name || ""}
                          isOptionEqualToValue={(opt: any, val: any) => opt.id === val.id}
                          value={wards.find((w: any) => String(w.id) === filters.wardId) || null}
                          onChange={(_, newValue: any) =>
                            handleFilterChange(
                              "wardId",
                              newValue?.id ? String(newValue.id) : undefined,
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
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={22} />
                        </TableCell>
                      </TableRow>
                    ) : data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#94a3b8" }}>
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
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={() => handleSelectOne(item.id!)}
                              />
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
                                <Tooltip title="Chỉnh sửa">
                                  <IconButton
                                    size="small"
                                    className={classes.actionIcon}
                                    onClick={() => router.push(`/doets/${item.id}/edit`)}
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
                              </Box>
                            </TableCell>
                            <TableCell className={classes.bodyCell}>{item.name}</TableCell>
                            <TableCell className={classes.bodyCell}>{item.taxCode}</TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.loaiHinhKinhDoanh?.tenloaihinh || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.businessLine?.tennganh || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell}>
                              {item.ward?.value || "-"}
                            </TableCell>
                            <TableCell className={classes.bodyCell} align="center">
                              <Switch
                                size="small"
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

        <BulkSelectionBar
          count={selectedIds.length}
          onDelete={handleBulkDelete}
          onClose={() => setSelectedIds([])}
        />

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
