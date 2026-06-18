/**
 * Interface representing a User in the system.
 */
export interface IUser {
  id?: string;
  username: string;
  email: string;
  role: 'ROLE_SO' | 'ROLE_DN';
  displayName: string;
  fullName?: string;
  avatar?: string;
  doet_id?: number;
  realRole?: string;
  roleId?: number;
}

/**
 * Interface for Login credentials.
 */
export interface ILoginCredentials {
  userName: string;
  password: string;
}

/**
 * Interface for the Login response from the server.
 */
export interface ILoginResponse {
  success: boolean;
  token?: string;
  user?: IUser;
  message?: string;
}

/**
 * Interface for generic API responses.
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

/**
 * Interface for OTP verification requests.
 */
export interface IOtpVerification {
  email: string;
  otp: string;
  newPassword?: string;
}

/**
 * Interface for Password Reset request.
 */
export interface IResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Interface for Profile Update request.
 */
export interface IUpdateProfileRequest {
  displayName: string;
  birthday?: string;
  gender?: string;
  title?: string;
  role?: string;
  city?: string;
  district?: string;
  address?: string;
  active?: boolean;
}

