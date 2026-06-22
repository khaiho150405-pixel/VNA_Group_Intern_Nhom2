/**
 * Core helper utilities for formatting and normalizing data.
 */

/**
 * Normalizes list responses from NestJS APIs to always return an array.
 */
export const normalizeListResponse = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.data?.items)) return raw.data.items;
  if (Array.isArray(raw.data?.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
};

/**
 * Formats a date string or Date object to YYYY-MM-DD for input elements.
 */
export const formatDateInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Formats a date string or Date object to DD/MM/YYYY for display elements.
 */
export const formatDateDisplay = (value?: string | Date | null) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const dd = `${date.getDate()}`.padStart(2, '0');
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
