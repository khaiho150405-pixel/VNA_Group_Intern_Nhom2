import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService, GetAllDto } from "src/commons";
import Response from "src/commons/response";
import { EntityManager, getManager, ILike, In, IsNull, Not, Repository, Raw } from "typeorm";
import { CurrentUser } from "../auth/auth.model";
import { User } from "./user.entity";
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

  async import(currentUser: CurrentUser, inputData: any): Promise<any> {
    try {
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

      for (const user of users) {
        const username = user.username ? user.username.trim() : '';
        const email = user.email ? user.email.trim() : '';

        // Map realRole to roleId if present
        if (user.realRole) {
          const roleKey = String(user.realRole).toLowerCase().trim();
          const roleMap: Record<string, { id: number; name: string }> = {
            'employee': { id: 1, name: 'Nhân viên' },
            'expert': { id: 2, name: 'Chuyên viên' },
            'leader': { id: 3, name: 'Lãnh đạo' },
            'superadmin': { id: 4, name: 'Quản trị viên' },
            'nhân viên': { id: 1, name: 'Nhân viên' },
            'chuyên viên': { id: 2, name: 'Chuyên viên' },
            'lãnh đạo': { id: 3, name: 'Lãnh đạo' },
            'quản trị viên': { id: 4, name: 'Quản trị viên' },
          };
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

          const newUser = this.userRepository.create({
            ...user,
            username,
            email,
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
      if (query.role) {
        const roleMap: Record<string, number> = {
          'Nhân viên': 1,
          'Chuyên viên': 2,
          'Lãnh đạo': 3,
          'Quản trị viên': 4,
        };
        const mappedRoleId = roleMap[query.role];
        if (mappedRoleId) {
          query.roleId = mappedRoleId;
        }
      }
      if (query.roleId) {
        if (+query.roleId === 4) {
          where.roleId = Not(4);
        } else {
          where.roleId = +query.roleId;
        }
      } else {
        where.roleId = Not(4);
      }
      if (query.status !== undefined && query.status !== "") {
        // ACTIVE status matches status = false or status is null
        if (query.status === "ACTIVE" || query.status === "true" || query.status === true || query.status === "1") {
          where.status = Raw(alias => `(${alias} IS NULL OR ${alias} = false)`);
        } else if (query.status === "INACTIVE" || query.status === "false" || query.status === false || query.status === "0") {
          // LOCKED status matches status = true
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

      if (!!province) {
        items = items.filter((x) => x.province?.key === province.key);
      }

      return Response.getList({
        items,
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

      // 4. Call base service put
      return await super.put(currentUser, id, itemDto);
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async post(currentUser: any, itemDto: any, doet: any): Promise<any> {
    try {
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
      const user = await this.userRepository.findOne({ where: { id: id as any }, relations: ["role"] });
      if (!user) throw Response.errorNotFound("Không tìm thấy người dùng");

      const updateData = { ...data };
      delete updateData.id;

      if (updateData.realRole) {
        const roleKey = String(updateData.realRole).toLowerCase().trim();
        const roleMap: Record<string, { id: number; name: string }> = {
          'employee': { id: 1, name: 'Nhân viên' },
          'expert': { id: 2, name: 'Chuyên viên' },
          'leader': { id: 3, name: 'Lãnh đạo' },
          'superadmin': { id: 4, name: 'Quản trị viên' },
          'nhân viên': { id: 1, name: 'Nhân viên' },
          'chuyên viên': { id: 2, name: 'Chuyên viên' },
          'lãnh đạo': { id: 3, name: 'Lãnh đạo' },
          'quản trị viên': { id: 4, name: 'Quản trị viên' },
        };
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

      // Explicitly update status if provided and allowed
      if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
        user.status = updateData.status === true || updateData.status === "true";
      }

      // Merge other fields
      Object.assign(user, updateData);

      await this.userRepository.save(user);
      return await this.userRepository.findOne({ where: { id: id as any }, relations: ["role"] });
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }

  async delete(currentUser: any, id: string): Promise<any> {
    try {
      await this.manager.query(`
        DELETE FROM users 
        WHERE id = $1
      `, [id]);

      return {
        success: true,
        message: "Xoá người dùng thành công"
      };
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
