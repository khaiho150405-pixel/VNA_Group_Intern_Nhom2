import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { UserService } from "src/modules/user/user.service";
import Response from "../response";
import { get } from "lodash";
import * as argon from "argon2";
import { NotAcceptableException, NotFoundException } from "../error";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      passReqToCallback: true
    });
  }

  async validate(
    request: any,
    username: string,
    password: string
  ): Promise<any> {
    try {
      const _where: {
        username: string,
        doet_id?: any,
      } = {
        username: username,
      };
      if (request.doet && request.doet.id) {
        _where.doet_id = request.doet.id;
      }
      const { data } = await this.userService.get({
        where: JSON.stringify(_where),
        relation: JSON.stringify(["role"])
      });

      const user = get(data, "items[0]");
      console.log("LocalStrategy user:", user);
      if (!user) {
        throw new NotFoundException('Account not found');
      }
      if (user && (user.role?.id === 4 || user.role?.role === 'superAdmin' || user.roleId === 4) && user.username !== 'testuser') {
        throw Response.errorBad("Tài khoản của bạn đang có quyền Admin. Hệ thống chỉ cho phép duy nhất tài khoản testuser có quyền Admin, vui lòng yêu cầu thay đổi vai trò của tài khoản này.");
      }
      // Logical status: true = Active, false = Locked
      if (user.status === false) {
        throw new NotAcceptableException({ message: 'Account is locked' });
      }
      const isMatch = await argon.verify(user.password, password);
      if (!isMatch) {
        throw Response.errorBad(Response.WRONG_PASS);
      }
      return user;
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
