/**
 * Centralized validation utilities for the application.
 */

export const VALIDATION_PATTERNS = {
  // RFC 5322 standard email regex
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Vietnam phone number regex (10 digits, starts with 0)
  PHONE: /^(0[2|3|5|7|8|9])([0-9]{8})$/,
  
  // Username: 3-50 characters, alphanumeric, underscore and hyphen
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  
  // OTP: 6 digits
  OTP: /^[0-9]{6}$/,
};

/**
 * Validation functions
 */
export const validate = {
  /**
   * Check if a string is a valid email
   */
  email: (email: string): boolean => {
    return VALIDATION_PATTERNS.EMAIL.test(email);
  },

  /**
   * Check if a string is a valid Vietnam phone number
   */
  phone: (phone: string): boolean => {
    return VALIDATION_PATTERNS.PHONE.test(phone);
  },

  /**
   * Check if a string is a valid username
   */
  username: (username: string): boolean => {
    return VALIDATION_PATTERNS.USERNAME.test(username);
  },

  /**
   * Check if a string is a valid OTP code
   */
  otp: (otp: string): boolean => {
    return VALIDATION_PATTERNS.OTP.test(otp);
  },

  /**
   * Check if a value is empty (null, undefined, or empty string)
   */
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  /**
   * Check minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  /**
   * Check maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },
};

/**
 * Common validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Vui lòng điền thông tin này',
  EMAIL_INVALID: 'Email không đúng định dạng',
  PHONE_INVALID: 'Số điện thoại không đúng định dạng',
  USERNAME_INVALID: 'Tên đăng nhập không hợp lệ (3-20 ký tự, không chứa ký tự đặc biệt)',
  PASSWORD_MIN_LENGTH: (min: number) => `Mật khẩu phải có ít nhất ${min} ký tự`,
  PASSWORD_CONFIRM_NOT_MATCH: 'Mật khẩu xác nhận không khớp',
  OTP_INVALID: 'Mã OTP phải có 6 chữ số',
  FULL_INFO_REQUIRED: 'Vui lòng nhập đầy đủ thông tin',
};
