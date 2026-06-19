export const initialAccountInfoState = {
  active: true,
  showEmailModal: false,
  username: '',
  password: '12345678',
  displayName: '',
  birthday: '',
  gender: '',
  title: '',
  role: '',
  email: '',
  city: '',
  district: '',
  address: '',
  avatarUrl: '',
  avatarFile: null as File | null,
  roles: [] as any[],
  provinces: [] as any[],
  districts: [] as any[],
  loading: false,
  toast: {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  },
  // Snapshot of initial form values for dirty-checking
  initialSnapshot: null as Record<string, any> | null,
};

export type AccountInfoState = typeof initialAccountInfoState;

export type AccountInfoAction =
  | { type: 'onChange'; name: keyof AccountInfoState; value: any }
  | { type: 'toggleActive' }
  | { type: 'toggleEmailModal'; value: boolean }
  | { type: 'setInitialData'; data: Partial<AccountInfoState> }
  | { type: 'setLoading'; value: boolean }
  | { type: 'removeAvatar' }
  | { type: 'showToast'; message: string; toastType: 'success' | 'error' }
  | { type: 'hideToast' };

export const accountInfoReducer = (state: AccountInfoState, action: AccountInfoAction): AccountInfoState => {
  switch (action.type) {
    case 'onChange':
      return {
        ...state,
        [action.name]: action.value,
      };
    case 'removeAvatar':
      return {
        ...state,
        avatarUrl: '',
        avatarFile: null,
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
    case 'setInitialData': {
      const snapshot: Record<string, any> = {};
      const editableKeys = ['displayName', 'birthday', 'gender', 'title', 'role', 'city', 'district', 'address', 'avatarUrl', 'active'];
      editableKeys.forEach((key) => {
        snapshot[key] = (action.data as any)[key] !== undefined ? (action.data as any)[key] : (state as any)[key];
      });
      return {
        ...state,
        ...action.data,
        initialSnapshot: snapshot,
      };
    }
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

