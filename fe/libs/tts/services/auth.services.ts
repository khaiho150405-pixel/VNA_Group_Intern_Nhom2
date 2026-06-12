import axiosClient from '@core/services/axiosClient';
import {
  ILoginResponse,
  IApiResponse,
  ILoginCredentials,
  IResetPasswordRequest,
  IUpdateProfileRequest
} from '@shared/tts/models/auth.model';
import { API_ENDPOINTS } from '@core/constants/api';

/**
 * Authentication related services
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: ILoginCredentials): Promise<ILoginResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      username: credentials.userName,
      password: credentials.password
    });
  },

  /**
   * Send OTP to email for password recovery
   */
  sendOtp: async (email: string): Promise<IApiResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (email: string, otp: string): Promise<IApiResponse> => {
    return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp });
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (data: IResetPasswordRequest): Promise<IApiResponse> => {
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
    const url = `/users/${userId}`;

    // if avatar is a File object, send as multipart/form-data
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
    return axiosClient.post('/auth/change-password', { oldPassword, newPassword });
  },

  /**
   * Check if email exists
   */
  checkEmail: async (email: string, excludeId?: string): Promise<{ email: string; existed: boolean }> => {
    return axiosClient.get(API_ENDPOINTS.USER.CHECK_EMAIL, {
      params: { email, excludeId }
    });
  },
};

