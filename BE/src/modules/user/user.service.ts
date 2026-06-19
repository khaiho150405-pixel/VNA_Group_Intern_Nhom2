import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService, GetAllDto } from "src/commons";
import Response from "src/commons/response";
import { EntityManager, getManager, ILike, In, IsNull, Not, Repository, Raw } from "typeorm";
import { CurrentUser } from "../auth/auth.model";
import { User } from "./user.entity";
import { Role } from "../role/role.entity";
import * as argon from "argon2";

@Injectable()
export class UserService extends BaseService<User> {
  manager: EntityManager;

  constructor(
    // @ts-ignore
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super(userRepository, (data: any) => this.userRepository.create(data));
    this.manager = getManager();
  }

  private checkPermission(currentUser: any) {
    if (!currentUser) return;
    const roleType = currentUser.role?.type;
    const roleId = currentUser.role?.id;
    const realRole = currentUser.realRole || '';
    
    // Đối với nhóm Sở: Nhân viên và Chuyên viên chỉ có quyền xem
    if (roleType === 'SO') {
      const isRestricted = roleId === 1 || roleId === 2 || 
                          realRole.includes('Nhân viên') || realRole.includes('Chuyên viên') ||
                          realRole.includes('Employee') || realRole.includes('Expert');
      
      const roleName = (currentUser.role?.name || '').toUpperCase();
      const isAdminOrLeader = roleName.includes('ADMIN') || roleName.includes('QUẢN TRỊ') || 
                              roleName.includes('LÃNH ĐẠO') || roleName.includes('LEADER');

      if (isRestricted && !isAdminOrLeader) {
        throw Response.errorForBidden("Tài khoản Nhân viên/Chuyên viên chỉ có quyền xem, không được thực hiện thao tác này.");
      }
    }
    
    // Đối với nhóm Doanh nghiệp: Không được phép quản lý người dùng
    // Sẽ được phép nếu gọi qua hàm updateUser với isSelfUpdate flag
    if (roleType === 'DN' && !currentUser.isUpdatingSelf) {
      throw Response.errorForBidden("Tài khoản Doanh nghiệp không có quyền quản lý người dùng.");
    }
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
      this.checkPermission(currentUser);
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
      this.checkPermission(currentUser);
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
      this.checkPermission(currentUser);
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

      const roleName = (currentUser?.realRole || '').toUpperCase();
      const roleCode = (currentUser?.role?.role || '').toUpperCase();
      const isAdmin = roleName.includes('ADMIN') || roleCode.includes('ADMIN') ||
        roleName.includes('QUẢN TRỊ') || roleName.includes('QUAN TRI');

      if (currentUser) {
        if (id === currentUser.id) {
          if (user.username === 'testuser') {
            delete updateData.roleId;
            delete updateData.realRole;
          }
          delete updateData.status;
        } else if (!isAdmin) {
          throw Response.errorForBidden("Bạn không có quyền chỉnh sửa thông tin người dùng này");
        }
      }

      // Skip permission check if self-updating
      if (!isSelfUpdate) {
        this.checkPermission(currentUser);
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

      if (updateData.roleId) {
        user.roleId = +updateData.roleId;
        user.role = { id: +updateData.roleId } as any;
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
        // Frontend true (Active) -> DB false, Frontend false (Inactive) -> DB true
        user.status = !(updateData.status === true || updateData.status === "true");
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
            "gpkdDate" = $2,
            email = $3,
            province = $4,
            ward = $5,
            address = $6,
            "taxCode" = $7
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
      this.checkPermission(currentUser);
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
      this.checkPermission(currentUser);
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
      this.checkPermission(currentUser);
      if (!ids || ids.length === 0) return { success: true };

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
      this.checkPermission(currentUser);
      return await super.deletes(currentUser, ids, doet);
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }
}
