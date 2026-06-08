export class Activity {
  roleId: number;
  roleName?: string;
  role: string;
  get: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  constructor(activity: Partial<Activity>) {
    Object.assign(this, activity);
  }
}
