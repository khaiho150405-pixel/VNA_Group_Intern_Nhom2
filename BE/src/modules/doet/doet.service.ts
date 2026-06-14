import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { EntityManager, getManager, Repository } from "typeorm";
import { Doet } from "./doet.entity";
import Response from "../../commons/response";
import { KeyValue } from "../../commons/bases/baseAddressEntity";
import * as argon from "argon2";

@Injectable()
export class DoetService extends BaseService<Doet> {
  manager: EntityManager;
  constructor(
    @InjectRepository(Doet)
    private readonly doetRepository: Repository<Doet>,
  ) {
    super(doetRepository, (data) => new Doet(data));
    this.manager = getManager();
  }

  async getSetting(doet: Doet) {
    if (doet && doet.id) {
      return {
        name: doet.name2,
        province: doet.province2,
        logo: doet.logo ? { url: doet.logo } : null,
        favicon: doet.favicon ? { url: doet.favicon } : null
      };
    }
    throw Response.errorNotFound(Response.NOT_FOUND("doet_id"));
  }

  async updateSetting(doet: Doet, name, logo, favicon, province) {
    try {
      if (doet && doet.id) {
        const data: {
          name2: string,
          province2: KeyValue,
          logo?: string,
          favicon?: string,
        } = {
          name2: name,
          province2: province,
        };
        if (logo) {
          data.logo = logo;
        }
        if (favicon) {
          data.favicon = favicon;
        }
        await this.doetRepository.update({
          id: doet.id
        }, data);
        return Response.SUCCESSFULLY;
      }
      throw Response.errorNotFound(Response.NOT_FOUND("doet_id"));
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async findWithFilters(query: any) {
    const { name, taxCode, loaiHinhId, businessLineId, status, page = 1, limit = 10 } = query;
    
    const qb = this.doetRepository.createQueryBuilder('doet')
      .leftJoinAndSelect('doet.loaiHinhKinhDoanh', 'loaiHinhKinhDoanh')
      .leftJoinAndSelect('doet.businessLine', 'businessLine');

    if (name) {
      qb.andWhere('doet.name ILIKE :name', { name: `%${name}%` });
    }

    if (taxCode) {
      qb.andWhere('doet.taxCode ILIKE :taxCode', { taxCode: `%${taxCode}%` });
    }

    if (loaiHinhId) {
      qb.andWhere('loaiHinhKinhDoanh.id = :loaiHinhId', { loaiHinhId });
    }

    if (businessLineId) {
      qb.andWhere('businessLine.id = :businessLineId', { businessLineId });
    }

    if (status) {
      qb.andWhere('doet.status = :status', { status });
    }

    qb.orderBy('doet.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    
    return { data, total, page, limit };
  }

  async sendOtp(email: string) {
    const doet = await this.doetRepository.findOne({ where: { email } });
    if (!doet) {
      throw Response.errorNotFound("Không tìm thấy doanh nghiệp với email này");
    }

    // Tạo OTP 6 số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Thời hạn OTP là 5 phút
    const otpExpired = new Date();
    otpExpired.setMinutes(otpExpired.getMinutes() + 5);

    await this.doetRepository.update(doet.id, { otp, otpExpired });

    // Giả lập log OTP (Nếu có Server SMTP, bạn dùng MailService gửi đi ở đoạn này)
    console.log(`[SIMULATED EMAIL] Mã OTP đổi mật khẩu cho ${doet.name} là: ${otp}`);

    return { success: true, message: "Đã gửi mã OTP thành công", otp: otp };
  }

  async changePassword(id: number, oldPassword: string, otp: string, newPassword: string) {
    const users = await this.manager.query(`SELECT * FROM users WHERE doet_id = $1`, [id]);
    if (!users || users.length === 0) throw Response.errorNotFound("Không tìm thấy tài khoản của doanh nghiệp");

    const user = users[0];
    const isMatch = await argon.verify(user.password, oldPassword);
    if (!isMatch) throw Response.errorBad("Mật khẩu cũ không chính xác");

    // Kiểm tra OTP
    const doet = await this.doetRepository.findOne({ where: { id } });
    if (!doet) throw Response.errorNotFound("Không tìm thấy doanh nghiệp");
    if (!doet.otp || doet.otp !== otp) throw Response.errorBad("Mã OTP không chính xác");
    if (new Date() > new Date(doet.otpExpired)) throw Response.errorBad("Mã OTP đã hết hạn");

    // Cập nhật mật khẩu trong bảng users bằng Argon2
    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, id]);

    // Xóa OTP đi sau khi đổi thành công
    await this.doetRepository.update(id, { otp: null, otpExpired: null });
    return { success: true, message: "Đổi mật khẩu thành công" };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    // Kiểm tra OTP
    const doet = await this.doetRepository.findOne({ where: { email } });
    if (!doet) throw Response.errorNotFound("Không tìm thấy doanh nghiệp với email này");
    if (!doet.otp || doet.otp !== otp) throw Response.errorBad("Mã OTP không chính xác");
    if (new Date() > new Date(doet.otpExpired)) throw Response.errorBad("Mã OTP đã hết hạn");

    // Cập nhật mật khẩu trong bảng users bằng Argon2
    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, doet.id]);

    // Xóa OTP đi sau khi khôi phục thành công
    await this.doetRepository.update(doet.id, { otp: null, otpExpired: null });
    return { success: true, message: "Khôi phục mật khẩu thành công" };
  }
}
