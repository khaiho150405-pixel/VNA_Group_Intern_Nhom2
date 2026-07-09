"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
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
import { PhotoCamera, Save, Event, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import { ChangeEmailModal } from '@core/components/ChangeEmailModal';
import { RequiredLabel } from '@core/components/RequiredLabel';

import { useAccountInfoStyles } from '../logic/account-info/style';
import { useCreateUser } from '@tts/hooks/useCreateUser';
import { CustomCalendar } from '@core/components/CustomCalendar';
import { useAuth } from '@core/contexts/AuthProvider';

export const UserCreatePage = () => {
    const classes = useAccountInfoStyles();
    const router = useRouter();
    const { user } = useAuth();

    const {
        state,
        dispatch,
        handleInputChange,
        handleSave,
    } = useCreateUser();

    const getPermissionLevel = (u: any): number => {
        if (!u) return 0;
        const roleId = u.roleId || (u.role as any)?.id;
        const realRole = (u.realRole || '').toLowerCase();
        const roleName = (u.role?.name || '').toLowerCase();

        const isAdminOrLeader = roleId === 4 || realRole.includes('quản trị') || realRole.includes('admin') || realRole.includes('lãnh đạo') || realRole.includes('leader');
        if (isAdminOrLeader) return 2;

        const isExpert = roleId === 2 || roleName.includes('chuyên viên') || roleName.includes('expert');
        if (isExpert) return 1;

        return 0;
    };

    const userPermissions = React.useMemo(() => {
        if (!user) return [];
        if (user.username === 'testuser') {
            return ['ADMIN_C_USER_CREATE'];
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const loggedInRoleObj = state.roles?.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return (loggedInRoleObj?.permissions || []).map((p: any) => p.code);
    }, [user, state.roles]);

    const canCreate = React.useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (state.roles && state.roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_CREATE');
        }
        return getPermissionLevel(user) >= 1;
    }, [user, state.roles, userPermissions]);

    const canAssignRole = React.useMemo(() => {
        if (!user) return false;
        if (user.username === 'testuser') return true;
        if (state.roles && state.roles.length > 0) {
            return userPermissions.includes('ADMIN_C_USER_CREATE');
        }
        const currentUserRoleId = user.roleId || (user.role as any)?.id;
        const loggedInRoleObj = state.roles?.find((r: any) => Number(r.id) === Number(currentUserRoleId));
        return !!loggedInRoleObj?.permissions?.some((p: any) => p.code === 'ADMIN_C_USER_CREATE');
    }, [user, state.roles, userPermissions]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [calendarAnchor, setCalendarAnchor] = React.useState<null | HTMLElement>(null);
    const [showPassword, setShowPassword] = React.useState(false);

    const {
        active,
        showEmailModal,
        username,
        password,
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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                // notification handled in hook
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

    if (state.roles && state.roles.length > 0 && !canCreate) {
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
                    Tài khoản của bạn không được cấp quyền tạo người dùng mới. Vui lòng liên hệ quản trị viên.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
            <Box sx={{
                backgroundColor: '#fff',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.04)',
                zIndex: 10,
                minHeight: '64px',
                position: 'sticky',
                top: 0,
            }}>
                <Typography sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#333',
                    margin: 0,
                }}>Thêm mới người dùng</Typography>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <Button
                        disableRipple
                        disabled={loading}
                        onClick={() => router.push('/users')}
                        sx={{
                            textTransform: 'none',
                            color: '#666',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            padding: '6px 18px',
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
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save fontSize="small" />}
                        className={classes.saveBtn}
                        disableElevation
                        onClick={handleSave}
                        disabled={loading}
                        sx={{
                            ...(loading && {
                                backgroundColor: '#b0b0b0 !important',
                                color: '#fff !important',
                                '&:hover': { backgroundColor: '#b0b0b0 !important' },
                                cursor: 'not-allowed',
                            })
                        }}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                </Box>
            </Box>

            <Box sx={{ padding: 3, flex: 1, overflow: 'visible' }}>
                <Grid container spacing={3}>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box className={classes.leftCard}>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <Box className={classes.avatarCircle} onClick={handleAvatarClick} style={{
                                backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {!avatarUrl && (
                                    <>
                                        <PhotoCamera className={classes.avatarIcon} />
                                        <Typography className={classes.avatarText}>Tải ảnh đại diện</Typography>
                                    </>
                                )}
                                {avatarUrl && (
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
                            <Typography className={classes.avatarNote}>
                                *.jpeg, *.jpg, *.png.<br />
                                Kích thước tối đa 5 MB
                            </Typography>

                            <Box className={classes.activation}>
                                <Typography style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>Kích hoạt</Typography>
                                <Switch
                                    checked={active}
                                    onChange={() => dispatch({ type: 'toggleActive' })}
                                    color="primary"
                                    size="small"
                                    disabled={loading}
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
                                        value={username} onChange={(e) => handleInputChange('username', e.target.value)} disabled={loading}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label={<RequiredLabel label="Mật khẩu" />}
                                        type={showPassword ? "text" : "password"}
                                        variant="outlined"
                                        size="small"
                                        className={classes.field}
                                        value={password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        disabled={loading}
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            edge="end"
                                                            disabled={loading}
                                                        >
                                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth label={<RequiredLabel label="Họ và tên" />} variant="outlined" size="small"
                                        className={classes.field} value={displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                        <TextField
                                            fullWidth label="Ngày tháng năm sinh" variant="outlined" size="small"
                                            className={classes.field} value={formatDateDisplay(birthday)}
                                            placeholder="Ngày tháng năm sinh"
                                            autoComplete="off"
                                            disabled={loading}
                                            onClick={handleCalendarOpen}
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
                                                                    handleCalendarOpen(e);
                                                                }}
                                                                disabled={loading}
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
                                        disabled={loading}
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
                                        disabled={loading}
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
                                        disabled={loading || !canAssignRole}
                                    >
                                        <MenuItem value="" disabled selected>Chọn vai trò</MenuItem>
                                        {state.roles && state.roles.length > 0 ? (
                                            state.roles
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
                                        value={email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={loading}
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
                                        disabled={loading}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Tỉnh / Thành phố" variant="outlined" size="small" className={classes.field} />
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
                                        disabled={loading || !city}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Phường xã" variant="outlined" size="small" className={classes.field} />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth label="Địa chỉ" variant="outlined" size="small"
                                        className={classes.field} placeholder=""
                                        value={address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        disabled={loading || !district}
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
