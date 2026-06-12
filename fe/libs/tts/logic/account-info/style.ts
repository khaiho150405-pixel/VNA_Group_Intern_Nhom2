"use client";
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

export const useAccountInfoStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  topTitleBar: {
    backgroundColor: '#8e8e8e',
    padding: theme.spacing(0.8, 2),
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  pageHeader: {
    backgroundColor: '#fff',
    padding: theme.spacing(2, 3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
    zIndex: 1,
    minHeight: '64px',
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#333',
    margin: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  cancelBtn: {
    textTransform: 'none',
    color: '#666',
    fontSize: '0.85rem',
    borderRadius: 6,
    padding: theme.spacing(0.5, 2),
    '&:hover': {
      backgroundColor: '#f5f5f7',
      color: '#333',
    }
  },
  saveBtn: {
    backgroundColor: '#2f65f0',
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(0.5, 3),
    borderRadius: 6,
    '&:hover': {
      backgroundColor: '#1e4fd1',
    },
  },
  mainContent: {
    padding: theme.spacing(3),
    flex: 1,
  },
  leftCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: theme.spacing(4, 2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: 'fit-content',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0',
    position: 'relative',
  },
  deleteAvatarBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: theme.palette.error.main,
    padding: 4,
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.04)',
    }
  },
  rightCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: theme.spacing(3, 4),
    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0',
  },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: '50%',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginBottom: theme.spacing(2),
    cursor: 'pointer',
    color: '#999',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f0f0f0',
      borderColor: '#e0e0e0',
    }
  },
  avatarIcon: {
    fontSize: '28px',
    marginBottom: theme.spacing(1),
  },
  avatarText: {
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  avatarNote: {
    fontSize: '0.7rem',
    color: '#999',
    textAlign: 'center',
    marginBottom: theme.spacing(4),
    lineHeight: 1.6,
  },
  activation: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    marginTop: theme.spacing(2),
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: '0.95rem',
    marginBottom: theme.spacing(3),
    color: '#333',
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 40,
      height: 2,
      backgroundColor: '#2f65f0',
      borderRadius: 1,
    }
  },
  field: {
    marginBottom: theme.spacing(2.5),
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: '#fff',
      '& fieldset': {
        borderColor: '#e0e0e0',
      },
      '&:hover fieldset': {
        borderColor: '#bdbdbd',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2f65f0',
      },
      '&.Mui-disabled': {
        backgroundColor: '#f9f9f9',
      },
      '& input[type="date"]::-webkit-calendar-picker-indicator': {
        display: 'none',
        appearance: 'none',
      }
    },
    '& .MuiInputLabel-outlined': {
      fontSize: '0.85rem',
      transform: 'translate(14px, 12px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px, -6px) scale(0.75)',
      }
    },
    '& .MuiOutlinedInput-input': {
      paddingTop: '10.5px',
      paddingBottom: '10.5px',
      paddingLeft: '14px',
      fontSize: '0.85rem',
    }
  },
  changeLink: {
    color: '#2f65f0',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: 0,
    minWidth: 'auto',
    marginLeft: theme.spacing(2),
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: 'transparent',
      textDecoration: 'none',
    }
  }
}));

