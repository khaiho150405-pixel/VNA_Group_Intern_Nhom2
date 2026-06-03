class Role {
  id?: number;
  role?: string;
  name?: string;

  constructor(role?: Partial<Role>, keys: string[] = ['id', 'role', 'name']) {
    role &&
      keys.forEach((key) => {
        role[key] !== undefined && (this[key] = role[key]);
      });
  }
}

export class CurrentUser {
  id: string;
  doet?: number;
  username: string;
  fullName?: string;
  realRole?: string;
  avatar?: string;
  role: Role;

  constructor(
    doet: number | null,
    user?: Partial<CurrentUser>,
    keys: string[] = ['id', 'username', 'fullName', 'realRole', 'role', 'avatar', 'unitId', 'workUnit'],
  ) {
    user &&
      keys.forEach((key) => {
        if (key === 'role') {
          user[key] !== undefined && (this[key] = new Role(user[key]));
        } else {
          user[key] !== undefined && (this[key] = user[key]);
        }
      });
    this.doet = doet;
  }
}

export class LoginModel {
  token: string;
  user?: CurrentUser;
  views: any;

  constructor(
    loginModel?: Partial<LoginModel>,
    keys: string[] = ['token', 'views', 'user'],
  ) {
    loginModel &&
      keys.forEach((key) => {
        loginModel[key] !== undefined && (this[key] = loginModel[key]);
      });
  }
}
