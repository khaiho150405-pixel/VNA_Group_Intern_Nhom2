import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getCookie } from './cookies';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
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
    // Handle Unauthorized (401) errors - e.g., redirect to login
    if (error.response?.status === 401) {
      console.error('Unauthorized! Redirecting to login...');
      // Logic for logout/redirect can go here
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
