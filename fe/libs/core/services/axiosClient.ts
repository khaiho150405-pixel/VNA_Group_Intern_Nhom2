import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getCookie, deleteCookie } from './cookies';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3800/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token to headers
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response Interceptor: Handle global error states
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: any) => {
    // Handle Unauthorized (401) or Account Disabled (3035) errors - redirect to login
    if (
      error.response?.status === 401 ||
      error.response?.data?.code === 3035 ||
      error.response?.data?.errors?.code === 3035 ||
      (error.response?.status === 403 &&
        (error.response?.data?.message?.includes('disabled') ||
          error.response?.data?.errors?.message?.includes('disabled')))
    ) {
      if (typeof window !== 'undefined') {
        console.error('Unauthorized or Account Disabled! Redirecting to login...');
        deleteCookie('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

