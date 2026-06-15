"use client";
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

export const useEnterpriseListStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: '#ffffff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  pageHeader: {
    backgroundColor: '#fff',
    padding: theme.spacing(2, 3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
    zIndex: 1,
    minHeight: 64,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#333',
    margin: 0,
    lineHeight: 1.4,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  importBtn: {
    textTransform: 'none',
    color: '#2f65f0',
    backgroundColor: '#fff',
    border: '1px solid #cfd9f3',
    fontWeight: 500,
    fontSize: '0.85rem',
    borderRadius: 6,
    padding: theme.spacing(0.6, 2),
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#f5f8ff',
      borderColor: '#b9c6ec',
    },
  },
  addBtn: {
    backgroundColor: '#2f65f0',
    color: '#fff',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: theme.spacing(0.6, 2),
    borderRadius: 6,
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: '#1e4fd1',
      boxShadow: 'none',
    },
  },
  mainContent: {
    padding: theme.spacing(3),
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  tableScroll: {
    flex: 1,
    overflow: 'auto',
  },
  headerCell: {
    fontWeight: 600,
    color: '#5a6478',
    fontSize: '0.85rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #eef0f4',
    padding: '12px 16px',
    whiteSpace: 'nowrap',
  },
  filterCell: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #eef0f4',
    padding: '8px 12px',
  },
  bodyCell: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#333',
    borderBottom: '1px solid #f3f5f9',
    fontWeight: 400,
  },
  rowSelected: {
    backgroundColor: '#eef3ff !important',
  },
  filterField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 4,
      backgroundColor: '#fff',
      fontSize: '0.85rem',
      '& fieldset': { borderColor: '#dfe3eb' },
      '&:hover fieldset': { borderColor: '#bcc4d3' },
      '&.Mui-focused fieldset': { borderColor: '#2f65f0' },
    },
    '& .MuiOutlinedInput-input': {
      padding: '7px 10px',
    },
  },
  actionIcon: {
    color: '#94a3b8',
    padding: 4,
    '&:hover': {
      color: '#2f65f0',
      backgroundColor: 'rgba(47,101,240,0.08)',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.25, 2),
    borderTop: '1px solid #eef0f4',
    backgroundColor: '#fff',
  },
  pageInfo: {
    fontSize: '0.85rem',
    color: '#5a6478',
  },
  pageSizeSelect: {
    height: 32,
    fontSize: '0.85rem',
    minWidth: 64,
    '& fieldset': { borderColor: '#dfe3eb' },
  },
}));
