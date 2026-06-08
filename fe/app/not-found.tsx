'use client';

import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import { makeStyles } from '@material-ui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  icon: {
    fontSize: '80px',
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    color: VNA_COLORS.black,
  },
  message: {
    color: VNA_COLORS.gray,
    marginBottom: theme.spacing(3),
    maxWidth: '500px',
  },
  button: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'none',
    padding: theme.spacing(1, 4),
    '&:hover': {
      backgroundColor: VNA_COLORS.primaryHover,
    },
  },
}));

export default function NotFound() {
  const classes = useStyles();

  return (
    <Container maxWidth="sm">
      <Box className={classes.root}>
        <Typography className={classes.icon}>🔍</Typography>
        <Typography variant="h4" className={classes.title}>
          404 - Không tìm thấy trang
        </Typography>
        <Typography variant="body1" className={classes.message}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </Typography>
        <Link href="/">
          <Button variant="contained" className={classes.button}>
            Quay lại trang chủ
          </Button>
        </Link>
      </Box>
    </Container>
  );
}
