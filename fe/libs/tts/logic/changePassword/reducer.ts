export interface ForgotPassState {
  step: 1 | 2; // Bước 1: Nhập Email, Bước 2: Nhập OTP & Mật khẩu mới
  email: string;
  newPassword: string;
  confirmPassword: string;
  otp: string;
  showNewPass: boolean;
  showConfirmPass: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export const initialForgotPassState: ForgotPassState = {
  step: 1,
  email: "",
  newPassword: "",
  confirmPassword: "",
  otp: "",
  showNewPass: false,
  showConfirmPass: false,
  errorMessage: null,
  successMessage: null,
};

export type ForgotPassAction =
  | { type: "onChange"; name: string; value: any }
  | { type: "toggleShowNewPass" }
  | { type: "toggleShowConfirmPass" }
  | { type: "nextStep" }
  | { type: "setError"; message: string | null }
  | { type: "setSuccess"; message: string | null }
  | { type: "reset" };

export const forgotPassReducer = (state: ForgotPassState, action: ForgotPassAction): ForgotPassState => {
  switch (action.type) {
    case "onChange":
      // Xóa thông báo khi người dùng bắt đầu nhập lại
      return { ...state, [action.name]: action.value, errorMessage: null, successMessage: null };
    case "toggleShowNewPass":
      return { ...state, showNewPass: !state.showNewPass };
    case "toggleShowConfirmPass":
      return { ...state, showConfirmPass: !state.showConfirmPass };
    case "nextStep":
      return { ...state, step: 2, errorMessage: null, successMessage: null };
    case "setError":
      return { ...state, errorMessage: action.message, successMessage: null };
    case "setSuccess":
      return { ...state, successMessage: action.message, errorMessage: null };
    case "reset":
      return initialForgotPassState;
    default:
      return state;
  }
};