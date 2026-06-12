"use client";
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Grid, 
  Button, 
  Popover,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  KeyboardArrowUp,
  KeyboardArrowDown
} from '@mui/icons-material';

interface CustomCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export const CustomCalendar = ({ value, onChange, open, anchorEl, onClose }: CustomCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleYearChange = (newYear: number) => setCurrentDate(new Date(newYear, month, 1));
  const handleMonthChange = (newMonth: number) => setCurrentDate(new Date(year, newMonth, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  
  // Adjust first day to start with Monday (T2)
  // Sun: 0 -> 6, Mon: 1 -> 0, Tue: 2 -> 1 ...
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = [];
  // Days from prev month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  // Days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true, date: new Date(year, month, i) });
  }
  // Days from next month
  const remainingSlots = 42 - days.length;
  for (let i = 1; i <= remainingSlots; i++) {
    days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  }

  const handleDateSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    onClose();
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    const vDate = new Date(value);
    return date.getFullYear() === vDate.getFullYear() &&
           date.getMonth() === vDate.getMonth() &&
           date.getDate() === vDate.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const years = [];
  for (let i = year - 50; i <= year + 50; i++) years.push(i);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: { 
            p: 1.5, 
            width: 280, 
            borderRadius: 2,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0'
          }
        }
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Grid container spacing={1} sx={{ alignItems: 'center' }}>
          <Grid size={7}>
            <Select
              value={month}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              size="small"
              fullWidth
              sx={{ 
                height: 32, 
                fontSize: '0.85rem', 
                fontWeight: 600,
                '& .MuiSelect-select': { py: 0 }
              }}
            >
              {monthNames.map((name, index) => (
                <MenuItem key={index} value={index} sx={{ fontSize: '0.85rem' }}>{name}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={5}>
            <Select
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              size="small"
              fullWidth
              sx={{ 
                height: 32, 
                fontSize: '0.85rem', 
                fontWeight: 600,
                '& .MuiSelect-select': { py: 0 }
              }}
            >
              {Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => 1920 + i)
                .reverse()
                .map((y) => (
                  <MenuItem key={y} value={y} sx={{ fontSize: '0.85rem' }}>{y}</MenuItem>
                ))}
            </Select>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 1 }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {dayLabels.map(label => (
          <Typography key={label} align="center" sx={{ fontSize: '0.7rem', color: '#1976d2', fontWeight: 600, py: 0.5 }}>
            {label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
        {days.map((d, index) => {
          const selected = d.current && isSelected(d.date);
          const today = d.current && isToday(d.date);
          return (
            <Box
              key={index}
              onClick={() => handleDateSelect(d.date)}
              sx={{
                aspectRatio: '1/1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: d.current ? '#333' : '#ccc',
                backgroundColor: selected ? '#2f65f0' : 'transparent',
                '&:hover': {
                  backgroundColor: selected ? '#2f65f0' : '#f0f4ff',
                },
                ...(selected && { color: '#fff', fontWeight: 600 }),
                ...(today && !selected && { border: '1px solid #2f65f0', color: '#2f65f0' })
              }}
            >
              {d.day}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
        <Button size="small" sx={{ textTransform: 'none', color: '#2f65f0', fontSize: '0.75rem' }} onClick={() => handleDateSelect(new Date())}>Hôm nay</Button>
        <Button size="small" sx={{ textTransform: 'none', color: '#666', fontSize: '0.75rem' }} onClick={() => { onChange(''); onClose(); }}>Xóa</Button>
      </Box>
    </Popover>
  );
};
