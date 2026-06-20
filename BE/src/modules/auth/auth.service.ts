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
import { DoetService } from "../doet/doet.service";

@Injectable()
export class AuthService {
  private registrationOtps = new Map<string, { otp: string, expires: Date }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly viewService: ViewService,
    private readonly doetService: DoetService
  ) {
  }

  async sendRegistrationOtp(email: string) {
    const check = await this.checkEmailExists(email);
    if (check.existed) {
      throw Response.errorBad("Email này đã được đăng ký trong hệ thống");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    this.registrationOtps.set(email, { otp, expires });

    const templatePath = path.resolve(process.cwd(), 'src/commons/templates/forgot-password.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace(/\$2/g, email).replace(/\$3/g, otp);
    template = template.replace('Lấy lại mật khẩu - Mã OTP', 'Xác thực đăng ký doanh nghiệp - Mã OTP');
    template = template.replace('Bạn vừa yêu cầu khôi phục mật khẩu', 'Bạn vừa đăng ký tài khoản doanh nghiệp');
    
    await Email.sendMail(email, "Xác thực đăng ký doanh nghiệp - Mã OTP", template);
    // write to txt for testing
    fs.writeFileSync(path.resolve(process.cwd(), 'reset_link.txt'), `OTP Đăng ký: ${otp}`);

    return Response.get({ message: "Đã gửi mã OTP", otp }); // Including otp for dev/test
  }

  verifyRegistrationOtp(email: string, otp: string): boolean {
    if (!email || !otp) {
      throw Response.errorBad("Vui lòng nhập đầy đủ thông tin");
    }
    const emailTrimmed = email.trim();
    const otpData = this.registrationOtps.get(emailTrimmed);
    if (!otpData) {
      throw Response.errorBad("Vui lòng yêu cầu mã OTP trước khi xác thực");
    }
    if (otpData.otp !== otp.trim()) {
      throw Response.errorBad("Mã OTP không chính xác");
    }
    if (new Date() > otpData.expires) {
      this.registrationOtps.delete(emailTrimmed);
      throw Response.errorBad("Mã OTP đã hết hạn");
    }
    return true;
  }


  async registerEnterprise(payload: any, otp: string) {
    const email = payload.email;
    const otpData = this.registrationOtps.get(email);
    
    if (!otpData) {
        throw Response.errorBad("Vui lòng yêu cầu mã OTP trước khi đăng ký");
    }
    if (otpData.otp !== otp) {
        throw Response.errorBad("Mã OTP không chính xác");
    }
    if (new Date() > otpData.expires) {
        this.registrationOtps.delete(email);
        throw Response.errorBad("Mã OTP đã hết hạn");
    }

    // Pass undefined as currentUser to bypass permission check in DoetService.post
    // Since it's a public endpoint
    const result = await this.doetService.post(undefined, payload, null);
    
    // Clear OTP after successful registration
    this.registrationOtps.delete(email);

    return Response.get(result);
  }

  async login(data: any, doet: Doet | null): Promise<ResponseData<LoginModel>> {
    try {
      const _doet = (doet && doet.id) ? doet.id : (data.doet_id || null);
      const user = new CurrentUser(_doet, data);
      const tokenPayload = { 
        ...user,
        passwordHash: data.password
      };
      delete tokenPayload.avatar;
      const [views, token] = await Promise.all([
        this.viewService.getViewsByRoleId(user.role?.id as any),
        this.jwtService.signAsync(tokenPayload)
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
      const payload = await this.jwtService.verifyAsync(token);

      // Verify user exists and is active
      const manage = getManager();
      const dbUser = await manage.findOne(User, {
        where: { id: payload.id },
        relations: ["role"]
      });
      if (!dbUser || dbUser.status === true) {
        throw Response.errorForBidden(Response.DISABLE_USER);
      }

      // Verify associated enterprise is active if user belongs to one
      if (dbUser.doet_id) {
        const doetObj = await manage.findOne(Doet, { where: { id: dbUser.doet_id } });
        if (!doetObj || doetObj.status !== 'ACTIVE') {
          throw Response.errorForBidden(Response.DISABLE_USER);
        }
      }

      if (dbUser && (dbUser.roleId === 4 || dbUser.role?.role === 'superAdmin' || dbUser.role?.id === 4) && dbUser.username !== 'testuser') {
        throw Response.errorForBidden("Tài khoản của bạn đang có quyền Admin. Hệ thống chỉ cho phép duy nhất tài khoản testuser có quyền Admin, vui lòng yêu cầu thay đổi vai trò của tài khoản này.");
      }

      // Check if password has been changed since the token was issued (or if it is an old token)
      if (!payload.passwordHash || dbUser.password !== payload.passwordHash) {
        throw Response.errorUnauthorized("Mật khẩu đã thay đổi, vui lòng đăng nhập lại.");
      }

      const _doet = (doet && doet.id) ? doet.id : (payload.doet || null);
      const user = new CurrentUser(_doet, payload);
      const views = await this.viewService.getViewsByRoleId(user.role?.id as any);
      const rs = new LoginModel({
        user,
        views: get(views, "data.items", [])
      });

      return Response.get<LoginModel>(rs);
    } catch (error: any) {
      if (error && error.status) {
        throw error;
      }
      if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
        throw Response.errorUnauthorized(Response.WRONG_TOKEN);
      }
      throw Response.errorInternal(error);
    }
  }

  async checkEmailExists(email: string): Promise<{ email: string; existed: boolean }> {
    try {
      const manage = getManager();
      const emailTrimmed = email.trim();
      
      const qbUser = manage.createQueryBuilder(User, 'user')
        .where('LOWER(user.email) = LOWER(:email)', { email: emailTrimmed })
        .andWhere('user.deletedAt IS NULL');
      const user = await qbUser.getOne();
      if (user) return { email, existed: true };

      const qbDoet = manage.createQueryBuilder(Doet, 'doet')
        .where('LOWER(doet.email) = LOWER(:email)', { email: emailTrimmed })
        .andWhere('doet.deletedAt IS NULL');
      const doet = await qbDoet.getOne();

      return { email, existed: !!doet };
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
          `${process.env.dirTemp || ''}/forgot-password.html`
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
      user.otp = null as any;
      user.otpExpired = null as any;
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

      user.otp = null as any;
      user.otpExpired = null as any;
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

      // Check if new password is the same as old password
      const isSame = await argon.verify(user.password, newPassword);
      if (isSame) {
        return Response.errorBad('Mật khẩu mới không được trùng với mật khẩu cũ');
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
