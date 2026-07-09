class Role {
  id?: number;
  role?: string;
  name?: string;
  type?: string;

  constructor(role?: Partial<Role>, keys: string[] = ['id', 'role', 'name', 'type']) {
    role &&
      keys.forEach((key) => {
        (role as any)[key] !== undefined && ((this as any)[key] = (role as any)[key]);
      });
  }
}

export class CurrentUser {
  id!: string;
  doet?: number | null;
  username!: string;
  fullName?: string;
  email?: string;
  realRole?: string;
  avatar?: string;
  role!: Role;
  unitId?: number;
  workUnit?: any;
  gender?: number;
  dateOfBirth?: Date;
  province?: any;
  district?: any;
  address?: string;
  allowedRoles?: string[];


  constructor(
    doet: number | null,
    user?: Partial<CurrentUser>,
    keys: string[] = [
      'id',
      'username',
      'fullName',
      'email',
      'realRole',
      'role',
      'avatar',
      'unitId',
      'workUnit',
      'gender',
      'dateOfBirth',
      'province',
      'district',
      'address',
      'allowedRoles'
    ],
  ) {
    user &&
      keys.forEach((key) => {
        if (key === 'role') {
          (user as any)[key] !== undefined && (this.role = new Role((user as any)[key]));
        } else {
          (user as any)[key] !== undefined && ((this as any)[key] = (user as any)[key]);
        }
      });
    this.doet = doet;
  }
}

export class LoginModel {
  token!: string;
  user?: CurrentUser;
  views: any;

  constructor(
    loginModel?: Partial<LoginModel>,
    keys: string[] = ['token', 'views', 'user'],
  ) {
    loginModel &&
      keys.forEach((key) => {
        (loginModel as any)[key] !== undefined && ((this as any)[key] = (loginModel as any)[key]);
      });
  }
}
