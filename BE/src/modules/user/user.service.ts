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

  async import(currentUser: CurrentUser, users: any): Promise<any> {
    try {
      let result = {
        success: 0,
        err: 0,
        username: [] as string[]
      };
      for (const user of users) {
        const username = user.username ? user.username.trim() : '';
        const email = user.email ? user.email.trim() : '';
        
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
          await this.userRepository.save(
            new User({
              ...user,
              username,
              email,
              password: user.password,
              createdBy: currentUser.id,
              createdAt: new Date()
            })
          );
          result.success += 1;
        }
      }
      return result;
    } catch (error) {
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
      }
      if (query.roleId) {
        where.roleId = +query.roleId;
      }
      if (query.status !== undefined && query.status !== "") {
        // ACTIVE status matches status = false or status is null
        if (query.status === "ACTIVE" || query.status === "false" || query.status === false || query.status === "0") {
          where.status = Raw(alias => `${alias} IS NULL OR ${alias} = false`);
        } else if (query.status === "INACTIVE" || query.status === "true" || query.status === true || query.status === "1") {
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
        withDeleted: true
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
      if (itemDto.email) {
        itemDto.email = itemDto.email.trim();
        const email = itemDto.email;
        const existedEmail = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.email) = :email", { email })
          .getOne();
        if (existedEmail) {
          throw Response.errorBad("Email này đã được sử dụng bởi một tài khoản khác");
        }
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
      const updateData = { ...data };
      delete updateData.id; // Xóa id để TypeORM không báo lỗi cập nhật khoá chính

      const isAdmin = currentUser && (
        currentUser.realRole === 'Admin' || 
        currentUser.realRole === 'ROLE_ADMIN' ||
        (currentUser.role && (currentUser.role.role === 'ROLE_ADMIN' || currentUser.role.role === 'ADMIN'))
      );

      // Differentiate between Personal Profile Edit vs Admin User List Edit
      if (currentUser) {
        if (id === currentUser.id) {
          // Case 1: Editing own profile -> Lock down privilege escalation fields
          delete updateData.roleId;
          delete updateData.realRole;
          delete updateData.status;
        } else {
          // Case 2: Editing other user -> Requires Admin privilege
          if (!isAdmin) {
            throw Response.errorForBidden("Bạn không có quyền chỉnh sửa thông tin người dùng này");
          }
        }
      }

      // Hash password if updating password
      if (updateData.password) {
        updateData.password = await argon.hash(updateData.password);
      }

      // Check email uniqueness if email is changed
      if (updateData.email) {
        updateData.email = updateData.email.trim();
        const email = updateData.email;
        const existedEmail = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.email) = :email", { email })
          .andWhere("u.id != :id", { id })
          .getOne();
        
        if (existedEmail) {
          throw Response.errorBad("Email này đã được sử dụng bởi một tài khoản khác");
        }
      }

      // Check username uniqueness if username is changed
      if (updateData.username) {
        updateData.username = updateData.username.trim();
        const username = updateData.username;
        const existedUsername = await this.userRepository.createQueryBuilder("u")
          .where("TRIM(u.username) = :username", { username })
          .andWhere("u.id != :id", { id })
          .getOne();
        
        if (existedUsername) {
          throw Response.errorBad("Tên đăng nhập đã tồn tại");
        }
      }

      if (updateData.roleId) {
        updateData.roleId = +updateData.roleId;
      }

      await this.userRepository.update(id, updateData);
      return await this.userRepository.findOne({ where: { id: id as any }, relations: ["role"] });
    } catch (error) {
      if (error?.status) throw error;
      throw Response.errorInternal(error);
    }
  }
}
