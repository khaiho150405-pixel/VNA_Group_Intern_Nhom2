export interface LoginState {
  userName: string;
  password: string;
  email: string;
  isShow: boolean;
  isMemory: boolean;
  forgotPass: boolean;
  errorMessage: string | null;
}

export const initialLoginState: LoginState = {
  userName: "",
  password: "",
  email: "",
  isShow: false,
  isMemory: false,
  forgotPass: false,
  errorMessage: null,
};

export type LoginAction =
  | { type: "onChange"; name: keyof LoginState; value: string | boolean }
  | { type: "setValues"; values: Partial<LoginState> }
  | { type: "showPassword" }
  | { type: "forgotPassword" }
  | { type: "reset" }
  | { type: "setError"; message: string | null };

export const loginReducer = (state: LoginState, action: LoginAction): LoginState => {
  switch (action.type) {
    case "onChange":
      return { 
        ...state, 
        [action.name]: action.value, 
        errorMessage: null 
      };
    case "setValues":
      return {
        ...state,
        ...action.values
      };
    case "showPassword":
      return { ...state, isShow: !state.isShow };
    case "forgotPassword":
      return { ...state, forgotPass: !state.forgotPass };
    case "reset":
      return initialLoginState;
    case "setError":
      return { ...state, errorMessage: action.message };
    default:
      return state;
  }
};
