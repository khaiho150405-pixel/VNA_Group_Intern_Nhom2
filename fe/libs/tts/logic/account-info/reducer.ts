export const initialAccountInfoState = {
  active: true,
  showEmailModal: false,
  username: '',
  displayName: '',
  birthday: '01/06/1995',
  gender: '',
  title: '',
  role: 'Admin',
  email: '',
  city: 'HCM',
  district: 'GV',
  address: '',
  avatarUrl: '',
  avatarFile: null as File | null,
  loading: false,
  toast: {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  }
};

export type AccountInfoState = typeof initialAccountInfoState;

export type AccountInfoAction =
  | { type: 'onChange'; name: keyof AccountInfoState; value: any }
  | { type: 'toggleActive' }
  | { type: 'toggleEmailModal'; value: boolean }
  | { type: 'setInitialData'; data: Partial<AccountInfoState> }
  | { type: 'setLoading'; value: boolean }
  | { type: 'showToast'; message: string; toastType: 'success' | 'error' }
  | { type: 'hideToast' };

export const accountInfoReducer = (state: AccountInfoState, action: AccountInfoAction): AccountInfoState => {
  switch (action.type) {
    case 'onChange':
      return {
        ...state,
        [action.name]: action.value,
      };
    case 'toggleActive':
      return {
        ...state,
        active: !state.active,
      };
    case 'toggleEmailModal':
      return {
        ...state,
        showEmailModal: action.value,
      };
    case 'setInitialData':
      return {
        ...state,
        ...action.data,
      };
    case 'setLoading':
      return {
        ...state,
        loading: action.value,
      };
    case 'showToast':
      return {
        ...state,
        toast: {
          show: true,
          message: action.message,
          type: action.toastType,
        },
      };
    case 'hideToast':
      return {
        ...state,
        toast: {
          ...state.toast,
          show: false,
        },
      };
    default:
      return state;
  }
};
