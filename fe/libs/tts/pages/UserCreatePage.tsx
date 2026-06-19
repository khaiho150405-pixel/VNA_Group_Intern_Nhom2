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
import { MainLayout } from '@core/layouts/MainLayout';
import { useAccountInfoStyles } from '../logic/account-info/style';
import { useCreateUser } from '@tts/hooks/useCreateUser';
import { CustomCalendar } from '@core/components/CustomCalendar';

export const UserCreatePage = () => {
    const classes = useAccountInfoStyles();
    const router = useRouter();
    const {
        state,
        dispatch,
        handleInputChange,
        handleSave,
    } = useCreateUser();

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
        districts
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

    return (
        <MainLayout>
            <Box className={classes.root}>
                <Box className={classes.pageHeader}>
                    <Typography className={classes.headerTitle}>Chi tiết người dùng</Typography>
                    <Box className={classes.actions}>
                        <Button className={classes.cancelBtn} disableRipple disabled={loading} onClick={() => router.push('/users')}>Hủy bỏ</Button>
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

                <Box className={classes.mainContent}>
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
                                                onChange={(val) => handleInputChange('birthday', val)}
                                                onClose={handleCalendarClose}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select fullWidth label="Giới tính" variant="outlined" size="small"
                                            className={classes.field} value={gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            disabled={loading}
                                        >
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
                                            disabled={loading}
                                        >
                                            <MenuItem value="" disabled selected>Chọn vai trò</MenuItem>
                                            {state.roles && state.roles.length > 0 ? (
                                                state.roles
                                                    .filter((r: any) => r.id !== 4 && r.name !== 'Quản trị viên')
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
                                            disabled={loading || !city}
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
        </MainLayout>
    );
};
