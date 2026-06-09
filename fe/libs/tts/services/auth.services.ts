import axiosClient from '@core/services/axiosClient';
import {
  ILoginResponse,
  IApiResponse,
  ILoginCredentials,
  IResetPasswordRequest,
  IUpdateProfileRequest
} from '@shared/tts/models/auth.model';
import { API_ENDPOINTS } from '@core/constants/api';
import { MOCK_USERS } from './mockData';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'false';

/**
 * Authentication related services
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: ILoginCredentials): Promise<ILoginResponse> => {
    if (USE_MOCK) {
      const { userName, password } = credentials;
      const user = MOCK_USERS.find(u => u.username === userName && u.password === password);

      await new Promise(resolve => setTimeout(resolve, 800));

      if (user) {
        return {
          success: true,
          token: 'mock-jwt-token',
          user: {
            username: user.username,
            email: user.email,
            role: user.role as 'ROLE_SO' | 'ROLE_DN',
            displayName: user.displayName
          }
        };
      }
      throw new Error('Tài khoản hoặc mật khẩu không đúng');
    }
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      username: credentials.userName,
      password: credentials.password
    });
  },

  /**
   * Send OTP to email for password recovery
   */
  sendOtp: async (email: string): Promise<IApiResponse> => {
    if (USE_MOCK) {
      const user = MOCK_USERS.find(u => u.email === email);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (user) {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[Mock API] OTP for ${email}: ${generatedOtp}`);
        localStorage.setItem("temp_otp", generatedOtp);
        return { success: true, message: 'Gửi mã OTP thành công (Mock)' };
      }
      throw new Error('Email chưa đăng ký');
    }
    return axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (email: string, otp: string): Promise<IApiResponse> => {
    if (USE_MOCK) {
      const storedOtp = localStorage.getItem("temp_otp");
      await new Promise(resolve => setTimeout(resolve, 800));
      if (otp === storedOtp) {
        return { success: true, message: 'Xác thực mã OTP thành công (Mock)' };
      }
      throw new Error('Mã OTP không chính xác');
    }
    return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (data: IResetPasswordRequest): Promise<IApiResponse> => {
    if (USE_MOCK) {
      const { otp } = data;
      const storedOtp = localStorage.getItem("temp_otp");
      await new Promise(resolve => setTimeout(resolve, 800));

      if (otp === storedOtp) {
        localStorage.removeItem("temp_otp");
        return { success: true, message: 'Đổi mật khẩu thành công (Mock)' };
      }
      throw new Error('Mã OTP không chính xác');
    }
    return axiosClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email: data.email,
      otp: data.otp,
      password: data.newPassword
    });
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, data: any): Promise<IApiResponse> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[Mock API] Updating profile with data:', data);

      if (data.avatar) {
        console.log('[Mock API] Avatar file received:', data.avatar.name, `(${data.avatar.size} bytes)`);
        // In a real scenario, this would be saved to a storage service and the URL saved to the DB
      }

      return { success: true, message: 'Cập nhật thông tin thành công (Mock)' };
    }

    const url = `/users/${userId}`;

    // For real API:
    // - if avatar is a File object, send as multipart/form-data
    // - if avatar is a data URL (string), send as JSON so backend can persist the string
    if (data.avatar) {
      // browser File instance -> use FormData
      if (typeof File !== 'undefined' && data.avatar instanceof File) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
          }
        });
        return axiosClient.put(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // avatar is not a File (likely a data URL string) -> send JSON
      if (typeof data.avatar === 'string') {
        return axiosClient.put(url, data);
      }
    }

    return axiosClient.put(url, data);
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<IApiResponse> => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800));
      // in mock mode, assume success
      return { success: true, message: 'Đổi mật khẩu thành công (Mock)' };
    }
    return axiosClient.post('/auth/change-password', { oldPassword, newPassword });
  },
};
