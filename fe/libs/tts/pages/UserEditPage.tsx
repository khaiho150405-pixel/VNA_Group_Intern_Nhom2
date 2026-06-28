"use client";
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    Switch,
    MenuItem,
    InputAdornment,
    CircularProgress,
    IconButton,
    Autocomplete
} from '@mui/material';
import { PhotoCamera, Save, Event, Delete } from '@mui/icons-material';
import { ChangeEmailModal } from '@core/components/ChangeEmailModal';
import { RequiredLabel } from '@core/components/RequiredLabel';

import { useAccountInfoStyles } from '../logic/account-info/style';
import { useEditUser } from '@tts/hooks/useEditUser';
import { CustomCalendar } from '@core/components/CustomCalendar';
import { useAuth } from '@core/contexts/AuthProvider';

// Phân quyền: 0=VIEW, 1=WRITE (Chuyên viên), 2=FULL (Admin/Lãnh đạo)
const getPermissionLevel = (user: any): number => {
    if (!user) return 0;
    const roleId = user?.roleId || user?.role?.id || 0;
    const realRole = (user?.realRole || '').toLowerCase();
    const roleName = (user?.role?.name || '').toLowerCase();
    
    // Admin/Lãnh đạo (roleId=4) -> FULL (2)
    if (roleId === 4 || realRole.includes('quản trị') || realRole.includes('admin') || 
        roleName.includes('quản trị') || roleName.includes('admin') ||
        realRole.includes('lãnh đạo') || roleName.includes('lãnh đạo')) return 2;
        
    // Chuyên viên (roleId=2) -> WRITE (1)
    if (roleId === 2 || realRole.includes('chuyên viên') || realRole.includes('expert') ||
        roleName.includes('chuyên viên') || roleName.includes('expert')) return 1;
        
    // Nhân viên -> VIEW (0)
    return 0;
};

export const UserEditPage = () => {
    const classes = useAccountInfoStyles();
    const router = useRouter();
    const params = useParams();
    const userId = params?.id as string;
    const {
        state,
        dispatch,
        handleInputChange,
        handleSave,
    } = useEditUser();
    const { user } = useAuth();

    const userPermissions = React.useMemo(() => {
        if (!user) return [];
        if (user.username === 'testuser') {
            return ['ADMIN_C_USER_VIEW', 'ADMIN_C_USER_UPDATE', 'ADMIN_C_USER_DELETE'];
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const loggedInRoleObj = state.roles?.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return (loggedInRoleObj?.permissions || []).map((p: any) => p.code);
    }, [user, state.roles]);

    const canView = React.useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (userId && String(user.id) === String(userId)) return true;
        if (state.roles && state.roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_VIEW');
        }
        return getPermissionLevel(user) >= 0;
    }, [user, userId, state.roles, userPermissions]);

    const canChangeStatus = React.useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (state.roles && state.roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_DELETE');
        }
        return getPermissionLevel(user) >= 2;
    }, [user, state.roles, userPermissions]);

    const canAssignRole = React.useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (state.roles && state.roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_UPDATE');
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const loggedInRoleObj = state.roles?.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return !!loggedInRoleObj?.permissions?.some((p: any) => p.code === 'ADMIN_C_USER_UPDATE');
    }, [user, state.roles, userPermissions]);

    // Kiểm tra quyền chỉnh sửa
    const canEdit = React.useMemo(() => {
        if (!user) return false;
        
        // Tự sửa chính mình: luôn được phép
        if (userId && String(user.id) === String(userId)) {
            return true;
        }

        // Kiểm tra quyền động
        if (state.roles && state.roles.length > 0) {
            const hasUpdatePerm = userPermissions.includes('ADMIN_C_USER_UPDATE');
            if (!hasUpdatePerm) return false;
        } else {
            // Fallback to static checks
            const currentLevel = getPermissionLevel(user);
            if (currentLevel < 1) return false;
        }
        
        const currentLevel = getPermissionLevel(user);
        
        // Admin/Lãnh đạo (level 2): được sửa tất cả mọi người
        if (currentLevel >= 2) return true;
        
        // Chuyên viên (level 1): được sửa chuyên viên, nhân viên, doanh nghiệp (tức là target level < 2)
        if (currentLevel === 1) {
            const targetUsername = state.username?.trim().toLowerCase();
            const isTestuser = targetUsername === 'testuser';
            
            // Lấy role của target user đang được edit
            const targetRoleId = Number(state.role);
            
            // Tìm role object trong danh sách roles
            const targetRoleObj = state.roles?.find((r: any) => Number(r.id) === targetRoleId);
            const targetRoleName = targetRoleObj ? targetRoleObj.name?.toLowerCase() : '';
            
            const isTargetAdmin = targetRoleId === 4 || 
                                 targetRoleName.includes('quản trị') || 
                                 targetRoleName.includes('admin') || 
                                 targetRoleName.includes('lãnh đạo') || 
                                 targetRoleName.includes('leader');
                                 
            return !isTestuser && !isTargetAdmin;
        }
        
        return false;
    }, [user, userId, state.username, state.role, state.roles, userPermissions]);

    const hasChanges = () => {
        if (!state.initialSnapshot) return false;
        if (state.avatarFile !== null) return true;

        const normalizeDate = (val: any) => {
            if (!val) return '';
            const d = new Date(val);
            return isNaN(d.getTime()) ? String(val) : d.toISOString().slice(0, 10);
        };

        const keys = ['displayName', 'birthday', 'gender', 'title', 'role', 'city', 'district', 'address', 'avatarUrl', 'active'];
        return keys.some(key => {
            const val1 = (state as any)[key];
            const val2 = state.initialSnapshot?.[key];
            if (key === 'birthday') {
                return normalizeDate(val1) !== normalizeDate(val2);
            }
            const normalize = (v: any) => (v === null || v === undefined ? '' : String(v));
            return normalize(val1) !== normalize(val2);
        });
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [calendarAnchor, setCalendarAnchor] = React.useState<null | HTMLElement>(null);

    const {
        active,
        showEmailModal,
        username,
        displayName,
        birthday,
        gender,
        title,
        role,
        email,
        city,
        district,
        address,
        avatarUrl,
        loading,
        roles,
        provinces,
        districts,
        allowedRoles
    } = state;

    const editableRoles = React.useMemo(() => {
        if (!roles) return [];
        const allowed = allowedRoles || [];
        return roles.filter((r: any) =>
            allowed.includes(String(r.role)) ||
            allowed.includes(String(r.id)) ||
            allowed.includes(String(r.name)) ||
            String(r.id) === String(role)
        );
    }, [roles, allowedRoles, role]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                // We'll let the user handle this with notification soon
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                dispatch({ type: 'onChange', name: 'avatarUrl', value: reader.result as string });
                dispatch({ type: 'onChange', name: 'avatarFile', value: file });
            };
            reader.readAsDataURL(file);
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        if (!y || !m || !d) return dateStr;
        return `${d}/${m}/${y}`;
    };

    const handleCalendarOpen = (event: React.MouseEvent<HTMLElement>) => {
        setCalendarAnchor(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchor(null);
    };

    if (state.roles && state.roles.length > 0 && !canView) {
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
                        Tài khoản của bạn không được cấp quyền xem thông tin người dùng này. Vui lòng liên hệ quản trị viên.
                    </Typography>
                </Box>
        );
    }

    return (
        <Box className={classes.root}>
                <Box className={classes.pageHeader}>
                    <Typography className={classes.headerTitle}>
                        {canEdit ? 'Chỉnh sửa người dùng' : 'Chi tiết người dùng'}
                    </Typography>
                    <Box className={classes.actions}>
                        <Button className={classes.cancelBtn} disableRipple disabled={loading} onClick={() => router.push('/users')}>
                            {canEdit ? 'Hủy bỏ' : 'Quay lại'}
                        </Button>
                        {canEdit && (
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save fontSize="small" />}
                                className={classes.saveBtn}
                                disableElevation
                                onClick={handleSave}
                                disabled={loading || !hasChanges()}
                                sx={{
                                    ...((loading || !hasChanges()) && {
                                        backgroundColor: '#b0b0b0 !important',
                                        color: '#fff !important',
                                        '&:hover': { backgroundColor: '#b0b0b0 !important' },
                                        cursor: 'not-allowed',
                                    })
                                }}
                            >
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box className={classes.mainContent}>
                    <Grid container spacing={3}>

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Box className={classes.leftCard}>
                                {canEdit && avatarUrl && (
                                    <IconButton
                                        className={classes.deleteAvatarBtn}
                                        onClick={() => dispatch({ type: 'removeAvatar' })}
                                        disabled={loading}
                                        size="small"
                                        title="Xóa ảnh"
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                )}
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Box className={classes.avatarCircle} onClick={canEdit ? handleAvatarClick : undefined} style={{
                                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: canEdit ? 'pointer' : 'default'
                                }}>
                                    {!avatarUrl && (
                                        <>
                                            <PhotoCamera className={classes.avatarIcon} />
                                            <Typography className={classes.avatarText}>
                                                {canEdit ? 'Tải ảnh đại diện' : 'Không có ảnh đại diện'}
                                            </Typography>
                                        </>
                                    )}
                                    {avatarUrl && canEdit && (
                                        <Box style={{
                                            position: 'absolute',
                                            top: 0, left: 0, width: '100%', height: '100%',
                                            backgroundColor: 'rgba(0,0,0,0.3)',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            opacity: 0, transition: 'opacity 0.2s',
                                            color: '#fff'
                                        }} className="avatar-hover">
                                            <PhotoCamera />
                                        </Box>
                                    )}
                                </Box>
                                {canEdit && (
                                    <Typography className={classes.avatarNote}>
                                        *.jpeg, *.jpg, *.png.<br />
                                        Kích thước tối đa 5 MB
                                    </Typography>
                                )}

                                <Box className={classes.activation}>
                                    <Typography style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>Kích hoạt</Typography>
                                    <Switch
                                        checked={active}
                                        onChange={() => {
                                            // Guard: testuser không được tắt trạng thái
                                            if (username?.trim().toLowerCase() === 'testuser' && active === true) return;
                                            dispatch({ type: 'toggleActive' });
                                        }}
                                        color="primary"
                                        size="small"
                                        disabled={loading || !canEdit || !canChangeStatus || (username?.trim().toLowerCase() === 'testuser')}
                                    />
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 9 }}>
                            <Box className={classes.rightCard}>
                                <Typography className={classes.sectionTitle}>Thông tin cá nhân</Typography>
                                <Grid container spacing={3}>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField fullWidth label={<RequiredLabel label="Tên đăng nhập" />} variant="outlined" size="small" className={classes.field}
                                            value={username} onChange={(e) => handleInputChange('username', e.target.value)} disabled={true}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth label={<RequiredLabel label="Họ và tên" />} variant="outlined" size="small"
                                            className={classes.field} value={displayName}
                                            onChange={(e) => handleInputChange('displayName', e.target.value)}
                                            disabled={loading || !canEdit}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                            <TextField
                                                fullWidth label="Ngày tháng năm sinh" variant="outlined" size="small"
                                                className={classes.field} value={formatDateDisplay(birthday)}
                                                placeholder="Ngày tháng năm sinh"
                                                autoComplete="off"
                                                disabled={loading || !canEdit}
                                                onClick={canEdit ? handleCalendarOpen : undefined}
                                                sx={{ '& .MuiOutlinedInput-root': { pr: '4px' } }}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (canEdit) handleCalendarOpen(e);
                                                                    }}
                                                                    disabled={loading || !canEdit}
                                                                    sx={{ padding: '4px' }}
                                                                >
                                                                    <Event fontSize="small" style={{ color: '#999' }} />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ),
                                                    }
                                                }}
                                            />
                                            <CustomCalendar
                                                open={Boolean(calendarAnchor)}
                                                anchorEl={calendarAnchor}
                                                value={birthday}
                                                maxDate={new Date()}
                                                onChange={(val) => handleInputChange('birthday', val)}
                                                onClose={handleCalendarClose}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select fullWidth label="Giới tính" variant="outlined" size="small"
                                            className={classes.field} value={gender ?? ''}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            disabled={loading || !canEdit}
                                            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                                        >
                                            <MenuItem value=""><em style={{ color: '#aaa' }}>-- Chọn giới tính --</em></MenuItem>
                                            <MenuItem value="Nam">Nam</MenuItem>
                                            <MenuItem value="Nữ">Nữ</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            fullWidth label="Chức danh" variant="outlined" size="small"
                                            className={classes.field} placeholder="Nhập chức danh"
                                            value={title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            disabled={loading || !canEdit}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select fullWidth label={<RequiredLabel label="Vai trò" />} variant="outlined" size="small"
                                            className={classes.field} value={role}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                select: { displayEmpty: true }
                                            }}
                                            disabled={loading || !canEdit || getPermissionLevel(user) === 0 || !canAssignRole}
                                        >
                                            <MenuItem value="" disabled selected>Chọn vai trò</MenuItem>
                                            {editableRoles && editableRoles.length > 0 ? (
                                                editableRoles
                                                    .map((r: any) => (
                                                        <MenuItem key={r.id} value={r.id}>
                                                            {r.name}
                                                        </MenuItem>
                                                    ))
                                            ) : (
                                                <MenuItem value="" disabled>
                                                    Đang tải dữ liệu...
                                                </MenuItem>
                                            )}
                                        </TextField>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField fullWidth label={<RequiredLabel label="Email" />} variant="outlined" size="small" className={classes.field}
                                            value={email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={loading || !canEdit}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography className={classes.sectionTitle} style={{ marginTop: '12px' }}>Thông tin liên hệ</Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            options={provinces || []}
                                            getOptionLabel={(option: any) => option.name || ''}
                                            value={provinces?.find((p: any) => String(p.code) === String(city)) || null}
                                            onChange={(_, newValue: any) => handleInputChange('city', newValue?.code || '')}
                                            disabled={loading || !canEdit}
                                            renderInput={(params) => (
                                                <TextField {...params} label="Tỉnh / Thành phố" variant="outlined" size="small" className={classes.field}  />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            options={districts || []}
                                            getOptionLabel={(option: any) => option.name || ''}
                                            value={districts?.find((d: any) => String(d.code) === String(district)) || null}
                                            onChange={(_, newValue: any) => handleInputChange('district', newValue?.code || '')}
                                            disabled={loading || !canEdit || !city}
                                            renderInput={(params) => (
                                                <TextField {...params} label="Phường xã" variant="outlined" size="small" className={classes.field}  />
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth label="Địa chỉ" variant="outlined" size="small"
                                            className={classes.field} placeholder=""
                                            value={address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            disabled={loading || !canEdit || !district}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <ChangeEmailModal open={showEmailModal} onClose={() => dispatch({ type: 'toggleEmailModal', value: false })} />
            </Box>
    );
};
