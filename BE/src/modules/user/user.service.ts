import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService, GetAllDto } from "src/commons";
import Response from "src/commons/response";
import { EntityManager, getManager, ILike, In, IsNull, Not, Repository, Raw } from "typeorm";
import { CurrentUser } from "../auth/auth.model";
import { User } from "./user.entity";
import { Role } from "../role/role.entity";
import { Doet } from "../doet/doet.entity";
import * as argon from "argon2";

@Injectable()
export class UserService extends BaseService<User> implements OnApplicationBootstrap {
  manager: EntityManager;

  constructor(
    // @ts-ignore
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super(userRepository, (data: any) => this.userRepository.create(data));
    this.manager = getManager();
  }

  async onApplicationBootstrap() {
    await this.ensureTestUserExists();
  }

  private async ensureTestUserExists() {
    try {
      const testUser = await this.userRepository.findOne({ where: { username: 'testuser' } });
      if (!testUser) {
        console.log("== [Auth Setup] Creating default 'testuser' admin account ==");
        // Seed password hash corresponding to '1'
        const seedPasswordHash = '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4';
        const defaultAdmin = this.userRepository.create({
          username: 'testuser',
          fullName: 'Hồ Sĩ Khải',
          password: seedPasswordHash,
          realRole: 'Quản trị viên',
          roleId: 4,
          email: '93.hosikhai.2019@gmail.com',
          status: false // DB false = Active
        });
        await this.userRepository.save(defaultAdmin);
        console.log("== [Auth Setup] Default 'testuser' admin account created successfully ==");
      }
    } catch (error) {
      console.error("== [Auth Setup] Error ensuring testuser exists:", error);
    }
  }

  // Lấy cấp độ quyền của người dùng hiện tại
  // 0 = VIEW (Nhân viên - chỉ xem)
  // 1 = WRITE (Chuyên viên - thêm, sửa, không xóa/status)
  // 2 = FULL (Admin/Lãnh đạo - đầy đủ quyền)
  private getPermissionLevel(currentUser: any): number {
    if (!currentUser) return 0;
    
    const roleType = currentUser.role?.type;
    const roleId = currentUser.role?.id;
    const realRole = (currentUser.realRole || '').toLowerCase();
    const roleName = (currentUser.role?.name || '').toLowerCase();
    
    // Doanh nghiệp - không quản lý user
    if (roleType === 'DN') return 0;
    
    // Nhóm Sở - phân quyền chi tiết
    if (roleType === 'SO') {
      // Admin/Lãnh đạo có quyền đầy đủ
      const isAdminOrLeader = roleName.includes('admin') || roleName.includes('quản trị') || 
                              roleName.includes('lãnh đạo') || roleName.includes('leader');
      if (isAdminOrLeader) return 2;
      
      // Chuyên viên có quyền thêm/sửa, không được xóa/cập nhật trạng thái
      const isExpert = realRole.includes('chuyên viên') || realRole.includes('expert') || roleId === 2;
      if (isExpert) return 1;
      
      // Nhân viên chỉ có quyền xem
      const isEmployee = realRole.includes('nhân viên') || realRole.includes('employee') || roleId === 1;
      if (isEmployee) return 0;
    }
    
    return 0;
  }

  private async hasPermission(roleId: number | undefined, code: string): Promise<boolean> {
    if (!roleId) return false;
    const count = await this.manager.query(
      `SELECT COUNT(*) FROM role_permissions WHERE role_id = $1 AND permission_code = $2`,
      [roleId, code]
    );
    return parseInt(count[0]?.count || '0', 10) > 0;
  }

  // Kiểm tra quyền ghi (thêm, sửa) - Chuyên viên trở lên hoặc tài khoản có quyền tương ứng
  private async checkWritePermission(currentUser: any, action: 'create' | 'update') {
    if (!currentUser) {
      throw Response.errorForBidden("Vui lòng đăng nhập.");
    }
    if (currentUser.username === 'testuser') {
      return;
    }
    const roleId = currentUser.role?.id;
    const requiredPermission = action === 'create' ? 'ADMIN_C_USER_CREATE' : 'ADMIN_C_USER_UPDATE';
    const allowed = await this.hasPermission(roleId, requiredPermission);
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 1) {
        throw Response.errorForBidden("Tài khoản của bạn chỉ có quyền xem, không được thực hiện thao tác này.");
      }
    }
  }

  // Kiểm tra quyền đầy đủ (xóa, cập nhật trạng thái) - Admin/Lãnh đạo hoặc tài khoản có quyền xóa
  private async checkFullPermission(currentUser: any) {
    if (!currentUser) {
      throw Response.errorForBidden("Vui lòng đăng nhập.");
    }
    if (currentUser.username === 'testuser') {
      return;
    }
    const roleId = currentUser.role?.id;
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_USER_DELETE');
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 2) {
        throw Response.errorForBidden("Bạn không có quyền thực hiện thao tác này. Chỉ Admin hoặc Lãnh đạo mới được phép xóa hoặc cập nhật trạng thái.");
      }
    }
  }

  // Check permission cũ - giữ lại để tương thích (sử dụng checkWritePermission)
  private async checkPermission(currentUser: any, action: 'create' | 'update' = 'create') {
    await this.checkWritePermission(currentUser, action);
  }

  private async getRoleMap(): Promise<Record<string, { id: number; name: string }>> {
    const roles = await this.manager.find(Role);
    const roleMap: Record<string, { id: number; name: string }> = {};
    roles.forEach(role => {
      roleMap[role.role.toLowerCase()] = { id: role.id, name: role.name };
      roleMap[role.name.toLowerCase()] = { id: role.id, name: role.name };
    });
    return roleMap;
  }

  async checkUsername(
    username: string
  ): Promise<{ username: string; existed: boolean }> {
    try {
      const foundedUser = await this.userRepository.createQueryBuilder("u")
        .where("TRIM(u.username) = :username", { username: username.trim() })
        .getOne();
      const result = !!foundedUser;
      return {
        username,
        existed: result
      };
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async checkEmail(
    email: string,
    excludeId?: string
  ): Promise<{ email: string; existed: boolean }> {
    try {
      const query = this.userRepository.createQueryBuilder("u")
        .where("TRIM(u.email) = :email", { email: email.trim() });

      if (excludeId && excludeId !== 'undefined') {
        query.andWhere("u.id != :id", { id: excludeId });
      }

      const foundedUser = await query.getOne();
      const result = !!foundedUser;
      return {
        email,
        existed: result
      };
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async get(getAllDto: GetAllDto, doet: any = null): Promise<any> {
    const dnRoles = await this.manager.find(Role, { where: { type: 'DN' } });
    const dnRoleIds = dnRoles.map(role => role.id);
    
    let where = (getAllDto.where && typeof getAllDto.where === 'string')
      ? JSON.parse(getAllDto.where)
      : (getAllDto.where || {});

    // Check if we are searching for a specific user to avoid filtering out DN users (e.g. login)
    let isSpecificQuery = false;
    if (where instanceof Array) {
      isSpecificQuery = where.some(item => item.username || item.id || item.email);
    } else if (where && typeof where === 'object') {
      isSpecificQuery = !!(where.username || where.id || where.email);
    }
    
    if (dnRoleIds.length > 0 && !isSpecificQuery) {
      if (where instanceof Array) {
        for (const item of where) {
          if (item.roleId) {
            if (dnRoleIds.includes(+item.roleId)) {
              item.roleId = -1;
            }
          } else {
            item.roleId = { operation: 'notIn', value: dnRoleIds };
          }
        }
      } else {
        if (where.roleId) {
          if (dnRoleIds.includes(+where.roleId)) {
            where.roleId = -1;
          }
        } else {
          where.roleId = { operation: 'notIn', value: dnRoleIds };
        }
      }
      getAllDto.where = JSON.stringify(where);
    }

    const response = await super.get(getAllDto, doet);
    if (response.data && response.data.items) {
      response.data.items = (response.data.items as any[]).map(u => ({
        ...u,
        status: u.status === false || u.status === null || u.status === undefined
      }));
    }
    return response;
  }

  async getDetail(getAllDto: GetAllDto, id: string, doet: any): Promise<any> {
    const response = await super.getDetail(getAllDto, id, doet);
    if (response.data) {
      const user = response.data as any;
      user.status = user.status === false || user.status === null || user.status === undefined;
      
      if (user.doet_id) {
        const doetRecords = await this.manager.query(`SELECT * FROM doets WHERE id = $1`, [user.doet_id]);
        if (doetRecords && doetRecords.length > 0) {
          const company = doetRecords[0];
          user.username = company.tax_code;
          user.fullName = company.name;
          user.dateOfBirth = company.gpkd_date;
          user.email = company.email;
          user.province = typeof company.province === 'string' ? JSON.parse(company.province) : company.province;
          user.district = typeof company.ward === 'string' ? JSON.parse(company.ward) : company.ward;
          user.address = company.address;
        }
      }
    }
    return response;
  }

  async import(currentUser: CurrentUser, inputData: any): Promise<any> {
    try {
      await this.checkPermission(currentUser, 'create');
      console.log("Dữ liệu gốc từ Frontend gửi xuống:", inputData);
      let users = inputData;
      if (inputData && typeof inputData === 'object' && !Array.isArray(inputData)) {
        users = inputData.data || inputData.users || inputData.items || Object.values(inputData)[0] || [];
      }
      if (!users || !Array.isArray(users)) {
        throw new Error("Dữ liệu gửi lên không đúng định dạng mảng (Array)!");
      }
      let result = {
        success: 0,
        err: 0,
        username: [] as string[]
      };

      const roleMap = await this.getRoleMap();

      const adminRoles = await this.manager.find(Role, {
        where: [
          { type: 'SO', role: 'superAdmin' },
          { name: ILike('%quản trị viên%') }
        ]
      });
      const adminRoleIds = adminRoles.map(r => r.id);
      if (adminRoleIds.length === 0) adminRoleIds.push(4);

      for (const user of users) {
        const username = user.username ? user.username.trim() : '';
        const email = user.email ? user.email.trim() : '';

        // Map realRole to roleId if present
        if (user.realRole) {
          const roleKey = String(user.realRole).toLowerCase().trim();
          const mappedRole = roleMap[roleKey];
          if (mappedRole) {
            user.roleId = mappedRole.id;
            user.realRole = mappedRole.name;
          }
        }

        const roleIdVal = user.roleId ? +user.roleId : undefined;
        if (roleIdVal) {
          const assignedRole = await this.manager.findOne(Role, roleIdVal);
          if (assignedRole && assignedRole.type !== 'DN') {
            const isTestUser = currentUser && currentUser.username === 'testuser';
            const hasUserCreatePermission = currentUser && await this.hasPermission(currentUser.role?.id, 'ADMIN_C_USER_CREATE');
            if (!isTestUser && !hasUserCreatePermission) {
              result.err += 1;
              result.username.push((user.username || 'Chưa có tên') + " (Chỉ tài khoản được cấp quyền mới được gán vai trò Sở)");
              continue;
            }
          }
        }

        if (roleIdVal && adminRoleIds.includes(roleIdVal) && username !== 'testuser') {
          result.err += 1;
          result.username.push((user.username || 'Chưa có tên') + " (Cấm gán quyền Admin)");
          continue;
        }

        const [existedUsername, existedEmail] = await Promise.all([
          this.userRepository.createQueryBuilder("u")
            .where("TRIM(u.username) = :username", { username })
            .getOne(),
          email ? this.userRepository.createQueryBuilder("u")
            .where("TRIM(u.email) = :email", { email })
            .getOne() : null
        ]);

        if (existedUsername || existedEmail) {
          result.err += 1;
          result.username.push(user.username);
        } else {
          const rawPassword = user.password || '12345678';
          const hashedPassword = await argon.hash(rawPassword);

          // Map logical status if provided, otherwise default to Active (DB false)
          let dbStatus = false;
          if (Object.prototype.hasOwnProperty.call(user, 'status')) {
            dbStatus = !(user.status === true || user.status === "true");
          }

          const newUser = this.userRepository.create({
            ...user,
            username,
            email,
            status: dbStatus,
            password: hashedPassword,
            createdBy: currentUser?.id || null,
            createdAt: new Date(),
          });

          await this.userRepository.save(newUser);
          result.success += 1;
        }
      }
      return result;
    } catch (error) {
      console.error("LỖI KHI LƯU DB (HÀM IMPORT):", error);
      throw Response.errorInternal(error);
    }
  }

  async getAll(query: any) {
    try {
      // Support both legacy GetAllDto (with JSON fields) and flat query parameters
      let pageSize = query.pageSize ? +query.pageSize : (query.limit ? +query.limit : 10);
      let pageNumber = query.pageNumber ? +query.pageNumber : (query.page ? +query.page - 1 : 0);
      if (pageNumber < 0) pageNumber = 0;

      const order = (query.order && JSON.parse(query.order)) || { id: "DESC" };
      const select = (query.select && JSON.parse(query.select)) || null;

      let relations = (query.relation && JSON.parse(query.relation)) || [];
      if (!relations.includes("role")) {
        relations.push("role");
      }

      const province = (query.province && JSON.parse(query.province)) || null;

      // Build TypeORM where filters
      const where: any = (query.where && JSON.parse(query.where)) || {};

      // If flat parameters are provided, map them directly to TypeORM where conditions
      if (query.fullName) {
        where.fullName = ILike(`%${query.fullName.trim()}%`);
      }
      if (query.username) {
        where.username = ILike(`%${query.username.trim()}%`);
      }
      if (query.email) {
        where.email = ILike(`%${query.email.trim()}%`);
      }
      if (query.workUnit) {
        where.workUnit = ILike(`%${query.workUnit.trim()}%`);
      } else if (query.jobTitle) {
        where.workUnit = ILike(`%${query.jobTitle.trim()}%`);
      }
      if (query.role || query.roleId) {
        const roleMap = await this.getRoleMap();
        if (query.role) {
          const mappedRole = roleMap[String(query.role).toLowerCase().trim()];
          if (mappedRole) {
            where.roleId = mappedRole.id;
          }
        } else if (query.roleId) {
          where.roleId = +query.roleId;
        }
      }
      if (query.status !== undefined && query.status !== "") {
        // Frontend "true" means Active, DB expects false/NULL for active
        if (query.status === "true" || query.status === true || query.status === "1") {
          where.status = Raw(alias => `(${alias} IS NULL OR ${alias} = false)`);
        } else if (query.status === "false" || query.status === false || query.status === "0") {
          // Frontend "false" means Inactive, DB expects true for inactive
          where.status = true;
        }
      }

      // Automatically filter out soft-deleted users unless requested
      if (!query.withDeleted) {
        where.deletedAt = IsNull();
      }

      // Automatically filter out enterprise accounts (role type DN)
      const dnRoles = await this.manager.find(Role, { where: { type: 'DN' } });
      const dnRoleIds = dnRoles.map(role => role.id);
      if (where instanceof Array) {
        for (const item of where) {
          if (dnRoleIds.length > 0) {
            if (item.roleId) {
              if (dnRoleIds.includes(+item.roleId)) {
                item.roleId = -1;
              }
            } else {
              item.roleId = Not(In(dnRoleIds));
            }
          }
        }
      } else {
        if (dnRoleIds.length > 0) {
          if (where.roleId) {
            if (dnRoleIds.includes(+where.roleId)) {
              where.roleId = -1;
            }
          } else {
            where.roleId = Not(In(dnRoleIds));
          }
        }
      }

      if (where instanceof Array) {
        for (const item of where) {
          Object.keys(item).forEach((key) => {
            if (item[key] && item[key].operation === "like") {
              item[key] = ILike(item[key].value);
            } else if (item[key] && item[key].operation === "in") {
              item[key] = In(item[key].value);
            } else if (item[key] && item[key].operation === "notIn") {
              item[key] = Not(In(item[key].value));
            }
          });
        }
      } else {
        Object.keys(where).forEach((key) => {
          if (where[key] && where[key].operation === "like") {
            where[key] = ILike(where[key].value);
          } else if (where[key] && where[key].operation === "in") {
            where[key] = In(where[key].value);
          } else if (where[key] && where[key].operation === "notIn") {
            where[key] = Not(In(where[key].value));
          }
        });
      }

      let [items, count] = await this.userRepository.findAndCount({
        where,
        relations,
        select,
        order: { ...order },
        skip: pageNumber * pageSize,
        take: pageSize,
      });

      // Flip status for Frontend: Active (DB false/null) -> true, Inactive (DB true) -> false
      let resultItems: any[] = items.map(u => ({
        ...u,
        status: u.status === false || u.status === null || u.status === undefined
      }));

      if (!!province) {
        resultItems = resultItems.filter((x) => x.province?.key === province.key);
      }

      return Response.getList({
        items: resultItems,
        count,
        pageSize,
        pageNumber
      });
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async put(currentUser: any, id: string, itemDto: any): Promise<any> {
    try {
      await this.checkPermission(currentUser, 'update');
      // 1. Check email uniqueness
      if (itemDto.email) {
        itemDto.email = itemDto.email.trim();
        const email = itemDto.email;
        const existedEmail = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.email) = :email", { email })
          .andWhere("u.id != :id", { id })
          .getOne();

        if (existedEmail) {
          throw Response.errorBad("Email này đã được sử dụng bởi một tài khoản khác");
        }
      }

      // 2. Check username uniqueness
      if (itemDto.username) {
        itemDto.username = itemDto.username.trim();
        const username = itemDto.username;
        const existedUsername = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.username) = :username", { username })
          .andWhere("u.id != :id", { id })
          .getOne();

        if (existedUsername) {
          throw Response.errorBad("Tên đăng nhập đã tồn tại");
        }
      }

      if (itemDto.title !== undefined) {
        itemDto.workUnit = itemDto.title;
      }
      if (itemDto.jobTitle !== undefined) {
        itemDto.workUnit = itemDto.jobTitle;
      }

      // 3. Map roleId directly if present
      if (itemDto.roleId) {
        itemDto.roleId = +itemDto.roleId;
      }

      // Check admin constraints
      const adminRoles = await this.manager.find(Role, {
        where: [
          { type: 'SO', role: 'superAdmin' },
          { name: ILike('%quản trị viên%') }
        ]
      });
      const adminRoleIds = adminRoles.map(r => r.id);
      if (adminRoleIds.length === 0) adminRoleIds.push(4);

      const targetUser = await this.userRepository.findOne(id);

      if (targetUser?.username === 'testuser') {
        if (itemDto.roleId && !adminRoleIds.includes(+itemDto.roleId)) {
          throw Response.errorBad("testuser là tài khoản quản trị viên mặc định, không được phép thay đổi vai trò.");
        }
        if (Object.prototype.hasOwnProperty.call(itemDto, 'status')) {
          const nextDbStatus = !(itemDto.status === true || itemDto.status === "true");
          if (nextDbStatus === true) {
            throw Response.errorBad("Tài khoản admin testuser là tài khoản mặc định, không thể bị tắt trạng thái hoạt động.");
          }
        }
      }

      if (itemDto.roleId && adminRoleIds.includes(+itemDto.roleId)) {
        const isTargetTestUser = targetUser?.username?.trim().toLowerCase() === 'testuser' || itemDto.username?.trim().toLowerCase() === 'testuser';
        if (!isTargetTestUser) {
          throw Response.errorBad("Cảnh báo: Tài khoản admin chỉ có 1 và duy nhất là testuser. Yêu cầu thay đổi sang tài khoản quản trị bị từ chối.");
        }
      }

      // Flip status for Database: Frontend true (Active) -> DB false, Frontend false (Inactive) -> DB true
      if (Object.prototype.hasOwnProperty.call(itemDto, 'status')) {
        itemDto.status = !(itemDto.status === true || itemDto.status === "true");
      }

      // 4. Call base service put
      return await super.put(currentUser, id, itemDto);
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async post(currentUser: any, itemDto: any, doet: any): Promise<any> {
    try {
      await this.checkPermission(currentUser, 'create');
      if (!itemDto.email || typeof itemDto.email !== 'string' || itemDto.email.trim() === '') {
        throw Response.errorBad("Email không được để trống");
      }
      itemDto.email = itemDto.email.trim();
      const email = itemDto.email;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw Response.errorBad("Email không đúng định dạng");
      }

      const existedEmail = await this.userRepository.createQueryBuilder("u")
        .where("TRIM(u.email) = :email", { email })
        .getOne();
      if (existedEmail) {
        throw Response.errorBad("Email này đã được sử dụng bởi một tài khoản khác");
      }

      if (itemDto.username) {
        itemDto.username = itemDto.username.trim();
        const username = itemDto.username;
        const existedUsername = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.username) = :username", { username })
          .getOne();
        if (existedUsername) {
          throw Response.errorBad("Tên đăng nhập đã tồn tại");
        }
      }

      if (itemDto.title !== undefined) {
        itemDto.workUnit = itemDto.title;
      }
      if (itemDto.jobTitle !== undefined) {
        itemDto.workUnit = itemDto.jobTitle;
      }

      // Map roleId if present
      if (itemDto.roleId) {
        itemDto.roleId = +itemDto.roleId;
        const assignedRole = await this.manager.findOne(Role, itemDto.roleId);
        if (assignedRole && assignedRole.type !== 'DN') {
          const isTestUser = currentUser && currentUser.username === 'testuser';
          const hasUserCreatePermission = currentUser && await this.hasPermission(currentUser.role?.id, 'ADMIN_C_USER_CREATE');
          if (!isTestUser && !hasUserCreatePermission) {
            throw Response.errorForBidden("Bạn không có quyền gán vai trò Sở.");
          }
        }
      }

      // Check admin constraints
      const adminRoles = await this.manager.find(Role, {
        where: [
          { type: 'SO', role: 'superAdmin' },
          { name: ILike('%quản trị viên%') }
        ]
      });
      const adminRoleIds = adminRoles.map(r => r.id);
      if (adminRoleIds.length === 0) adminRoleIds.push(4);

      if (itemDto.roleId && adminRoleIds.includes(+itemDto.roleId) && itemDto.username !== 'testuser') {
        throw Response.errorBad("Cảnh báo: Tài khoản admin chỉ có 1 và duy nhất là testuser. Yêu cầu tạo tài khoản admin bị từ chối.");
      }

      // Flip status for Database: Frontend true (Active) -> DB false, Frontend false (Inactive) -> DB true
      if (Object.prototype.hasOwnProperty.call(itemDto, 'status')) {
        itemDto.status = !(itemDto.status === true || itemDto.status === "true");
      }

      // Ràng buộc: Mỗi doanh nghiệp chỉ được có 1 user truy cập duy nhất
      if (itemDto.doet_id) {
        const existedDoetUser = await this.userRepository.findOne({
          where: { doet_id: itemDto.doet_id, deletedAt: IsNull() }
        });
        if (existedDoetUser) {
          throw Response.errorBad("Doanh nghiệp này đã có tài khoản truy cập. Mỗi doanh nghiệp chỉ được có 1 user duy nhất.");
        }
      }

      return await super.post(currentUser, itemDto, doet);
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async recovery(user_id) {
    await this.manager.query(`update users
                              set "deletedBy" = NULL,
                                  "deletedAt" = null
                              where id = '${user_id}'`);
    return {
      success: true
    };
  }

  async resetPassword(user_id: string) {
    const _newPassword = await argon.hash("12345678");
    await this.manager
      .query(`update users
              set password = '${_newPassword}'
              where id = '${user_id}'`);
    return {
      success: true
    };
  }

  async resetPasswordCustom(user_id: string, passwordNew?: string) {
    const rawPassword = passwordNew || "12345678";
    const _newPassword = await argon.hash(rawPassword);
    await this.manager
      .query(`update users
              set password = $1
              where id = $2`, [_newPassword, user_id]);
    return {
      success: true
    };
  }

  async updateUser(id: string, data: any, currentUser?: any): Promise<any> {
    try {
      // Check if user is updating their own profile
      const isSelfUpdate = currentUser && id === currentUser.id;
      
      const user = await this.userRepository.findOne({ where: { id: id as any }, relations: ["role"] });
      if (!user) throw Response.errorNotFound("Không tìm thấy người dùng");

      const updateData = { ...data };
      delete updateData.id;

      // Security: Only testuser or users with ADMIN_C_USER_UPDATE permission can assign allowedRoles
      if (Object.prototype.hasOwnProperty.call(updateData, 'allowedRoles')) {
        let canAssignAllowedRoles = false;
        if (currentUser) {
          if (currentUser.username === 'testuser') {
            canAssignAllowedRoles = true;
          } else if (currentUser.role?.id) {
            // Check if the current user's role has ADMIN_C_USER_UPDATE permission
            const roleWithPerms = await this.userRepository.manager.findOne(
              'Role',
              { where: { id: currentUser.role.id }, relations: ['permissions'] } as any
            ) as any;
            canAssignAllowedRoles = Array.isArray(roleWithPerms?.permissions) &&
              roleWithPerms.permissions.some((p: any) => p.code === 'ADMIN_C_USER_UPDATE');
          }
        }
        if (!canAssignAllowedRoles) {
          delete updateData.allowedRoles;
        }
      }

      if (updateData.realRole) {
        const roleMap = await this.getRoleMap();
        const roleKey = String(updateData.realRole).toLowerCase().trim();
        const mappedRole = roleMap[roleKey];
        if (mappedRole) {
          updateData.roleId = mappedRole.id;
          updateData.realRole = mappedRole.name;
        }
      }

      if (updateData.title !== undefined) {
        updateData.workUnit = updateData.title;
      }
      if (updateData.jobTitle !== undefined) {
        updateData.workUnit = updateData.jobTitle;
      }

      const currentLevel = this.getPermissionLevel(currentUser);
      const targetLevel = this.getPermissionLevel(user);

      if (currentUser) {
        if (id === currentUser.id) {
          delete updateData.status;
        } else {
          // If not self-updating, verify permissions
          if (currentLevel < 1) {
            // Nhân viên/Doanh nghiệp: Không được phép chỉnh sửa người khác
            throw Response.errorForBidden("Bạn không có quyền chỉnh sửa thông tin người dùng này");
          }
          if (currentLevel === 1) {
            // Chuyên viên: chỉ được sửa chuyên viên (level 1), nhân viên (level 0) và doanh nghiệp (level 0)
            // Không được sửa Admin/Lãnh đạo (level 2)
            if (targetLevel >= 2) {
              throw Response.errorForBidden("Bạn không có quyền chỉnh sửa thông tin của quản trị viên hoặc lãnh đạo");
            }
          }
        }
      }

      // Skip permission check if self-updating
      if (!isSelfUpdate) {
        await this.checkPermission(currentUser, 'update');
      }

      if (updateData.password) {
        updateData.password = await argon.hash(updateData.password);
      }

      if (updateData.email) {
        const email = updateData.email.trim();
        const existedEmail = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.email) = :email", { email })
          .andWhere("u.id != :id", { id })
          .getOne();
        if (existedEmail) throw Response.errorBad("Email này đã được sử dụng bởi một tài khoản khác");

        if (user.doet_id) {
          const existedDoetEmail = await this.manager.createQueryBuilder(Doet, 'doet')
            .where('LOWER(doet.email) = LOWER(:email)', { email })
            .andWhere('doet.id <> :doetId', { doetId: user.doet_id })
            .andWhere('doet.deletedAt IS NULL')
            .getOne();
          if (existedDoetEmail) {
            throw Response.errorBad("Email này đã được sử dụng bởi một doanh nghiệp khác");
          }
        } else {
          const existedDoetEmail = await this.manager.createQueryBuilder(Doet, 'doet')
            .where('LOWER(doet.email) = LOWER(:email)', { email })
            .andWhere('doet.deletedAt IS NULL')
            .getOne();
          if (existedDoetEmail) {
            throw Response.errorBad("Email này đã được sử dụng bởi một doanh nghiệp khác");
          }
        }
        user.email = email;
      }

      if (updateData.username) {
        const username = updateData.username.trim();
        const existedUsername = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.username) = :username", { username })
          .andWhere("u.id != :id", { id })
          .getOne();
        if (existedUsername) throw Response.errorBad("Tên đăng nhập đã tồn tại");
        user.username = username;
      }

      // Check admin constraints
      const adminRoles = await this.manager.find(Role, {
        where: [
          { type: 'SO', role: 'superAdmin' },
          { name: ILike('%quản trị viên%') }
        ]
      });
      const adminRoleIds = adminRoles.map(r => r.id);
      if (adminRoleIds.length === 0) adminRoleIds.push(4);

      const usernameLower = user.username?.trim().toLowerCase();
      if (usernameLower === 'testuser') {
        if (updateData.roleId && !adminRoleIds.includes(+updateData.roleId)) {
          throw Response.errorBad("testuser là tài khoản quản trị viên mặc định, không được phép thay đổi vai trò.");
        }
      }

      if (updateData.roleId && adminRoleIds.includes(+updateData.roleId)) {
        if (usernameLower !== 'testuser') {
          throw Response.errorBad("Cảnh báo: Tài khoản admin chỉ có 1 và duy nhất là testuser. Yêu cầu thay đổi sang tài khoản quản trị bị từ chối.");
        }
      }

      if (updateData.roleId) {
        const nextRoleId = +updateData.roleId;
        if (nextRoleId !== user.roleId) {
          const assignedRole = await this.manager.findOne(Role, nextRoleId);
          if (assignedRole && assignedRole.type !== 'DN') {
            const isTestUser = currentUser && currentUser.username === 'testuser';
            const hasUserUpdatePermission = currentUser && await this.hasPermission(currentUser.role?.id, 'ADMIN_C_USER_UPDATE');
            
            let selfAllowed = false;
            if (isSelfUpdate && user.allowedRoles) {
              const allowedIds = Array.isArray(user.allowedRoles)
                ? user.allowedRoles.map(String)
                : String(user.allowedRoles).split(',').filter(Boolean);
              const allowedIdsNormalized = allowedIds.map(id => id.toLowerCase().trim());
              if (
                allowedIds.includes(String(nextRoleId)) ||
                (assignedRole && (
                  allowedIdsNormalized.includes(String(assignedRole.role).toLowerCase().trim()) ||
                  allowedIdsNormalized.includes(String(assignedRole.name).toLowerCase().trim()) ||
                  allowedIdsNormalized.includes(String(assignedRole.id).toLowerCase().trim())
                ))
              ) {
                selfAllowed = true;
              }
            }

            if (!isTestUser && !hasUserUpdatePermission && !selfAllowed) {
              throw Response.errorForBidden("Bạn không có quyền gán hoặc sửa đổi vai trò Sở.");
            }

            // Perform Role Swapping in allowedRoles!
            const oldRoleKey = user.role?.role;
            const newRoleKey = assignedRole.role;

            let allowed: string[] = [];
            const rawAllowed = Object.prototype.hasOwnProperty.call(updateData, 'allowedRoles')
              ? updateData.allowedRoles
              : user.allowedRoles;

            if (Array.isArray(rawAllowed)) {
              allowed = [...rawAllowed.map(String)];
            } else if (typeof rawAllowed === 'string') {
              allowed = String(rawAllowed).split(',').map(s => s.trim()).filter(Boolean);
            }

            // 1. Add old role key to allowedRoles
            if (oldRoleKey && !allowed.includes(oldRoleKey)) {
              allowed.push(oldRoleKey);
            }

            // 2. Remove new role key/id/name from allowedRoles
            if (newRoleKey) {
              allowed = allowed.filter(r => {
                const rLower = String(r || '').toLowerCase().trim();
                return rLower !== String(newRoleKey).toLowerCase().trim() &&
                       rLower !== String(assignedRole.id).trim() &&
                       rLower !== String(assignedRole.name).toLowerCase().trim();
              });
            }

            // Set back to updateData or user
            if (Object.prototype.hasOwnProperty.call(updateData, 'allowedRoles')) {
              updateData.allowedRoles = allowed;
            } else {
              user.allowedRoles = allowed;
            }
          }
        }
        user.roleId = nextRoleId;
        user.role = { id: nextRoleId } as any;
      }

      // Ràng buộc: Mỗi doanh nghiệp chỉ được có 1 user truy cập duy nhất
      if (updateData.doet_id && updateData.doet_id !== user.doet_id) {
        const existedDoetUser = await this.userRepository.findOne({
          where: { doet_id: updateData.doet_id, deletedAt: IsNull() }
        });
        if (existedDoetUser) {
          throw Response.errorBad("Doanh nghiệp này đã có tài khoản truy cập. Mỗi doanh nghiệp chỉ được có 1 user duy nhất.");
        }
      }

      // Explicitly update status if provided and allowed
      if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
        const newDbStatus = !(updateData.status === true || updateData.status === "true");
        if (usernameLower === 'testuser' && newDbStatus === true) {
          throw Response.errorBad("Tài khoản admin testuser là tài khoản mặc định, không thể bị tắt trạng thái hoạt động.");
        }
        // Frontend true (Active) -> DB false, Frontend false (Inactive) -> DB true
        user.status = newDbStatus;
        delete updateData.status;
      }

      // Merge other fields
      Object.assign(user, updateData);

      await this.userRepository.save(user);
      if (user.doet_id) {
        await this.manager.query(`
          UPDATE doets
          SET 
            name = $1,
            gpkd_date = $2,
            email = $3,
            province = $4,
            ward = $5,
            address = $6,
            tax_code = $7
          WHERE id = $8
        `, [
          user.fullName,
          user.dateOfBirth ? new Date(user.dateOfBirth) : null,
          user.email,
          user.province ? JSON.stringify(user.province) : null,
          user.district ? JSON.stringify(user.district) : null,
          user.address,
          user.username,
          user.doet_id
        ]);
      }
      return await this.userRepository.findOne({ where: { id: id as any }, relations: ["role"] });
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async delete(currentUser: any, id: string): Promise<any> {
    try {
      await this.checkFullPermission(currentUser);
      const targetUser = await this.userRepository.findOne(id);
      if (targetUser?.username?.trim().toLowerCase() === 'testuser') {
        throw Response.errorBad("Cảnh báo: testuser là tài khoản quản trị viên mặc định, không được phép xóa tài khoản này.");
      }
      await this.userRepository.delete(id);
      return {
        success: true,
        message: "Xoá người dùng thành công"
      };
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async destroy(currentUser: any, id: string): Promise<any> {
    try {
      await this.checkFullPermission(currentUser);
      const targetUser = await this.userRepository.findOne(id);
      if (targetUser?.username?.trim().toLowerCase() === 'testuser') {
        throw Response.errorBad("Cảnh báo: testuser là tài khoản quản trị viên mặc định, không được phép xóa tài khoản này.");
      }
      await this.userRepository.delete(id);
      return {
        success: true,
        message: "Xoá người dùng thành công"
      };
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async destroys(currentUser: any, ids: string[], doet: any): Promise<any> {
    try {
      await this.checkFullPermission(currentUser);
      if (!ids || ids.length === 0) return { success: true };

      const targetUsers = await this.userRepository.findByIds(ids);
      const hasTestUser = targetUsers.some(u => u.username?.trim().toLowerCase() === 'testuser');
      if (hasTestUser) {
        throw Response.errorBad("Cảnh báo: testuser là tài khoản quản trị viên mặc định, không được phép xóa tài khoản này.");
      }

      await this.userRepository.delete(ids);

      return {
        success: true,
        message: "Xoá người dùng thành công"
      };
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async deletes(currentUser: any, ids: string[], doet: any): Promise<any> {
    try {
      await this.checkFullPermission(currentUser);
      if (!ids || ids.length === 0) return { success: true };

      const targetUsers = await this.userRepository.findByIds(ids);
      const hasTestUser = targetUsers.some(u => u.username?.trim().toLowerCase() === 'testuser');
      if (hasTestUser) {
        throw Response.errorBad("Cảnh báo: testuser là tài khoản quản trị viên mặc định, không được phép xóa tài khoản này.");
      }

      return await super.deletes(currentUser, ids, doet);
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }
}
