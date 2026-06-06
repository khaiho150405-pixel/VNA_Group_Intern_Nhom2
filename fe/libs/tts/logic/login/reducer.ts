// reducer.ts
export interface LoginState {
  userName: "";
  password: "";
  email: "";
  isShow: boolean;
  isMemory: boolean;
  forgotPass: boolean;
  errorMessage: string | null; // NEW
}

export const initialLoginState: LoginState = {
  userName: "",
  password: "",
  email: "",
  isShow: false,
  isMemory: false,
  forgotPass: false,
  errorMessage: null, // NEW
};

export type LoginAction =
  | { type: "onChange"; name: string; value: any }
  | { type: "showPassword" }
  | { type: "forgotPassword" }
  | { type: "reset" }
  | { type: "setError"; message: string | null }; // NEW

export const loginReducer = (state: LoginState, action: LoginAction): LoginState => {
  switch (action.type) {
    case "onChange":
      // Reset lỗi khi người dùng thay đổi input
      return { ...state, [action.name]: action.value, errorMessage: null };
    case "showPassword":
      return { ...state, isShow: !state.isShow };
    case "forgotPassword":
      return { ...state, forgotPass: !state.forgotPass };
    case "reset":
      return initialLoginState;
    case "setError": // NEW
      return { ...state, errorMessage: action.message };
    default:
      return state;
  }
};