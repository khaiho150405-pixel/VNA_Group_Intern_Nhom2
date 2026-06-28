'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Pagination,
  FormControl,
  Autocomplete
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

import { useAuth } from '@core/contexts/AuthProvider';
import { permissionService } from '@tts/services/permission.services';
import { useSnackbar } from 'notistack';
import { useUserListStyles } from '../logic/user/style';

export const PermissionListPage = () => {
  const classes = useUserListStyles();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);

  // Filters state matching table columns
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: '',
    code: '',
    name: ''
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'ADMIN_G_DEPARTMENT': true, // Default expanded as in screenshots
  });

  const isTestUser = user?.username === 'testuser';

  useEffect(() => {
    if (!isTestUser) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const res = await permissionService.getAll();
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else {
          list = res?.data?.items || res?.items || [];
        }
        setPermissions(list);
      } catch (error) {
        enqueueSnackbar('Lỗi tải danh sách quyền hệ thống', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [isTestUser, enqueueSnackbar]);

  const toggleGroup = (code: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  // Group permissions
  const groups = useMemo(() => {
    return permissions.filter((p) => p.type === 'Group');
  }, [permissions]);

  const getComponentsForGroup = (groupCode: string) => {
    return permissions
      .filter((p) => p.type === 'Component' && p.parentCode === groupCode)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Filtering logic
  const filteredGroups = useMemo(() => {
    const list: any[] = [];
    groups
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(group => {
        const components = getComponentsForGroup(group.code);
        
        // Filter components
        const matchingComponents = components.filter(comp => {
          const matchType = !filters.type || comp.type === filters.type;
          const matchCode = !filters.code || comp.code.toLowerCase().includes(filters.code.toLowerCase());
          const matchName = !filters.name || comp.name.toLowerCase().includes(filters.name.toLowerCase());
          return matchType && matchCode && matchName;
        });

        // Filter group itself
        const matchGroupType = !filters.type || group.type === filters.type;
        const matchGroupCode = !filters.code || group.code.toLowerCase().includes(filters.code.toLowerCase());
        const matchGroupName = !filters.name || group.name.toLowerCase().includes(filters.name.toLowerCase());
        const groupMatches = matchGroupType && matchGroupCode && matchGroupName;

        // Include group if it matches or has matching components
        if (groupMatches || matchingComponents.length > 0) {
          list.push({
            ...group,
            matchingComponents: groupMatches && !filters.type ? components : matchingComponents,
            groupMatches
          });
        }
      });
    return list;
  }, [permissions, groups, filters.type, filters.code, filters.name]);

  // Roman numerals conversion for group STT
  const toRoman = (num: number): string => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || String(num);
  };

  // Pagination bounds
  const total = filteredGroups.length;
  const paginatedGroups = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.limit;
    return filteredGroups.slice(startIndex, startIndex + filters.limit);
  }, [filteredGroups, filters.page, filters.limit]);

  const startIndex = total > 0 ? (filters.page - 1) * filters.limit + 1 : 0;
  const endIndex = Math.min(total, filters.page * filters.limit);

  // Deny access for users other than testuser (placed below all hooks)
  if (!isTestUser) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Box sx={{ bgcolor: '#fee2e2', p: 3, borderRadius: '50%', mb: 3 }}>
            <Typography color="error" variant="h3" component="div" sx={{ display: 'flex' }}>
              🔒
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
            Quyền truy cập bị từ chối
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3, textAlign: 'center', maxWidth: 450 }}>
            Chỉ tài khoản quản trị hệ thống mặc định (<strong>testuser</strong>) mới được phép truy cập và xem chi tiết cấu hình quyền hạn này.
          </Typography>
        </Box>
    );
  }

  return (
    <Box className={classes.root}>
        <Box className={classes.pageHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography className={classes.headerTitle}>
              Danh sách quyền
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className={classes.mainContent}>
        <Box className={classes.card}>
          <Box className={classes.tableScroll}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={45} thickness={4} sx={{ color: '#2f65f0' }} />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.headerCell} width={60} />
                      <TableCell className={classes.headerCell} width={80}>STT</TableCell>
                      <TableCell className={classes.headerCell} width={150}>Loại</TableCell>
                      <TableCell className={classes.headerCell} width={300}>Mã quyền</TableCell>
                      <TableCell className={classes.headerCell}>Tên quyền</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell} />
                      <TableCell className={classes.filterCell}>
                        <Autocomplete
                          size="small"
                          options={[
                            { label: "Nhóm quyền", value: "Group" },
                            { label: "Quyền thành viên", value: "Component" }
                          ]}
                          getOptionLabel={(option) => option.label || ""}
                          value={[
                            { label: "Nhóm quyền", value: "Group" },
                            { label: "Quyền thành viên", value: "Component" }
                          ].find(item => item.value === filters.type) || null}
                          onChange={(_, newValue) =>
                            handleFilterChange("type", newValue?.value || "")
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
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Mã quyền"
                          value={filters.code}
                          onChange={(e) => handleFilterChange("code", e.target.value)}
                          className={classes.filterField}
                        />
                      </TableCell>
                      <TableCell className={classes.filterCell}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Tên quyền"
                          value={filters.name}
                          onChange={(e) => handleFilterChange("name", e.target.value)}
                          className={classes.filterField}
                        />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedGroups.map((group) => {
                        const originalIndex = filteredGroups.indexOf(group) + 1;
                        const isExpanded = !!expandedGroups[group.code];
                        const showComponents = isExpanded && group.matchingComponents.length > 0;

                        return (
                          <React.Fragment key={group.code}>
                            {/* Group Row */}
                            <TableRow hover onClick={() => toggleGroup(group.code)} sx={{ cursor: 'pointer', bgcolor: '#fafafa' }}>
                              <TableCell className={classes.bodyCell} align="center" onClick={(e) => { e.stopPropagation(); toggleGroup(group.code); }}>
                                <IconButton size="small">
                                  {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                </IconButton>
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600 }}>
                                {toRoman(originalIndex)}
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600 }}>
                                {group.type}
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                                {group.code}
                              </TableCell>
                              <TableCell className={classes.bodyCell} sx={{ fontWeight: 600 }}>
                                {group.name}
                              </TableCell>
                            </TableRow>

                            {/* Component Rows */}
                            {showComponents &&
                              group.matchingComponents.map((comp: any, cIdx: number) => (
                                <TableRow key={comp.code} hover>
                                  <TableCell className={classes.bodyCell} />
                                  <TableCell className={classes.bodyCell} sx={{ pl: 3, color: '#64748b' }}>
                                    {cIdx + 1}
                                  </TableCell>
                                  <TableCell className={classes.bodyCell} sx={{ color: '#64748b' }}>
                                    {comp.type}
                                  </TableCell>
                                  <TableCell className={classes.bodyCell} sx={{ pl: 4, fontFamily: 'monospace', color: '#334155' }}>
                                    {comp.code}
                                  </TableCell>
                                  <TableCell className={classes.bodyCell} sx={{ pl: 3, color: '#475569' }}>
                                    {comp.name}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {!loading && total > 0 && (
            <Box className={classes.footer}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                  className={classes.pageSizeSelect}
                  size="small"
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
                  onChange={(_, page) => handleFilterChange("page", page)}
                  shape="rounded"
                  size="small"
                  siblingCount={0}
                  boundaryCount={1}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
