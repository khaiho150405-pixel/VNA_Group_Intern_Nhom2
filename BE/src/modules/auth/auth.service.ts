import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import Response, { ResponseData } from "src/commons/response";
import { ViewService } from "../view/view.service";
import { CurrentUser, LoginModel } from "./auth.model";
import { get } from "lodash";
import { Doet } from "../doet/doet.entity";
import { User } from "../user/user.entity";
import { getManager } from "typeorm";
import { extractHostname } from "src/commons/helper/Domain";
import * as fs from "fs";
import * as path from "path";
import Email from "../../commons/helper/Email";
import * as argon from "argon2";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly viewService: ViewService
  ) {
  }

  async login(data: any, doet: Doet | null): Promise<ResponseData<LoginModel>> {
    try {
      const _doet = doet && doet.id ? doet.id : null;
      const user = new CurrentUser(_doet, data);
      const tokenPayload = { ...user };
      delete tokenPayload.avatar;
      const [views, token] = await Promise.all([
        await this.viewService.getViewsByRoleId(user.role.id),
        await this.jwtService.sign(tokenPayload)
      ]);
      const rs = new LoginModel({
        token,
        views: get(views, "data.items", []),
        user
      });
      return Response.get<LoginModel>(rs);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async validateToken(token: string, doet: Doet | null): Promise<ResponseData<LoginModel>> {
    try {
      const _doet = doet && doet.id ? doet.id : null;
      const user = new CurrentUser(_doet, await this.jwtService.verifyAsync(token));
      const views = await this.viewService.getViewsByRoleId(user.role.id);
      const rs = new LoginModel({
        user,
        views: get(views, "data.items", [])
      });

      return Response.get<LoginModel>(rs);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async forgotPassword(email: string, domain: string) {
    try {
      const manage = getManager();
      const user = await manage.findOne(User, {
        where: {
          email: email
        }
      });
      if (!user) {
        throw Response.errorNotFound("Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau");
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpired = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await manage.save(user);

      const template = fs.readFileSync(
        path.resolve(
          __dirname,
          `${process.env.dirTemp}/forgot-password.html`
        ), {
          encoding: "utf-8"
        });

      fs.writeFileSync(path.resolve(process.cwd(), 'reset_link.txt'), `OTP: ${otp}`);
      await Email.sendMail(email, "Lấy lại mật khẩu - Mã OTP", template
        .replace(/\$1/g, user.fullName || '')
        .replace(/\$2/g, user.username)
        .replace(/\$3/g, otp)
      );
      return Response.SUCCESSFULLY;
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async resetPassword(email: string, otp: string, passwordNew: string) {
    try {
      const manage = getManager();
      const user = await manage.findOne(User, {
        where: {
          email: email
        }
      });
      if (!user) {
        throw Response.errorNotFound("Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau");
      }
      if (!user.otp || user.otp !== otp) {
        return Response.errorBad("Mã OTP không chính xác");
      }
      if (!user.otpExpired || new Date() > new Date(user.otpExpired)) {
        return Response.errorBad("Mã OTP đã hết hạn");
      }

      const _newPassword = await argon.hash(passwordNew);
      user.password = _newPassword;
      user.otp = null;
      user.otpExpired = null;
      await manage.save(user);

      return Response.SUCCESSFULLY;
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async verifyOtp(email: string, otp: string) {
    try {
      const manage = getManager();
      const user = await manage.findOne(User, {
        where: {
          email: email
        }
      });
      if (!user) {
        throw Response.errorNotFound("Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau");
      }
      if (!user.otp || user.otp !== otp) {
        return Response.errorBad("Mã OTP không chính xác");
      }
      if (!user.otpExpired || new Date() > new Date(user.otpExpired)) {
        return Response.errorBad("Mã OTP đã hết hạn");
      }

      user.otp = null;
      user.otpExpired = null;
      await manage.save(user);

      return Response.SUCCESSFULLY;
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const manage = getManager();
      const user = await manage.findOne(User, { where: { id: userId } });
      if (!user) {
        return Response.errorNotFound('User not found');
      }

      // verify old password
      const match = await argon.verify(user.password, oldPassword);
      if (!match) {
        return Response.errorBad('Mật khẩu cũ không đúng');
      }

      const _newPassword = await argon.hash(newPassword);
      user.password = _newPassword;
      await manage.save(user);

      return Response.SUCCESSFULLY;
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
