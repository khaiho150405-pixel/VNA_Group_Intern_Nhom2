import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { EntityManager, getManager, In, Repository } from "typeorm";
import { Doet } from "./doet.entity";
import Response from "../../commons/response";
import { KeyValue } from "../../commons/bases/baseAddressEntity";
import * as argon from "argon2";
import { LoaiHinhKinhDoanh } from "../loai-hinh-kinh-doanh/loai-hinh-kinh-doanh.entity";
import { BusinessLine } from "../business-line/business-line.entity";
import { User } from "../user/user.entity";
import * as ExcelJS from 'exceljs';

@Injectable()
export class DoetService extends BaseService<Doet> {
  manager: EntityManager;
  constructor(
    @InjectRepository(Doet)
    private readonly doetRepository: Repository<Doet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(doetRepository, (data) => new Doet(data));
    this.manager = getManager();
  }

  private normalizeDoetPayload(itemDto: any) {
    if (!itemDto) return itemDto;

    const data = { ...itemDto };

    if (data.loaiHinhId && !data.loaiHinhKinhDoanh) {
      data.loaiHinhKinhDoanh = Object.assign(new LoaiHinhKinhDoanh(), { id: Number(data.loaiHinhId) });
    }

    if (data.businessLineId && !data.businessLine) {
      data.businessLine = Object.assign(new BusinessLine(), { id: Number(data.businessLineId) });
    }

    delete data.loaiHinhId;
    delete data.businessLineId;

    return data;
  }

  // Tự động tạo tài khoản User cho doanh nghiệp mới
  private async createUserForDoet(doet: Doet | { id: number; taxCode: string; email?: string }) {
    if (!doet || !doet.id || !doet.taxCode) return null;

    try {
      let username = doet.taxCode;
      let counter = 1;

      // Check for username collision and generate unique one
      while (await this.userRepository.findOne({ where: { username } })) {
        username = `${doet.taxCode}_${counter}`;
        counter++;
      }

      const plainTaxCode = doet.taxCode.replace("-", "");
      const defaultPassword = plainTaxCode.slice(-6);
      const hashedPassword = await argon.hash(defaultPassword);

      const user = new User({
        username: username,
        password: hashedPassword,
        email: doet.email,
        doet_id: doet.id,
      } as any);

      await this.userRepository.save(user);
      return { username, password: defaultPassword };
    } catch (error) {
      console.error("Lỗi khi tự động tạo tài khoản doanh nghiệp:", error);
      return null;
    }
  }

  private async deleteUsersOfDoets(doetIds: Array<number | string>) {
    if (!doetIds || doetIds.length === 0) return;
    const ids = doetIds.map((x) => Number(x)).filter((x) => Number.isFinite(x));
    if (ids.length === 0) return;
    try {
      await this.userRepository.delete({ doet_id: In(ids) as any });
    } catch (error) {
      console.error("Lỗi khi xoá tài khoản của doanh nghiệp:", error);
    }
  }

  async post(currentUser: any, itemDto: any, doet: Doet) {
    const result = await super.post(currentUser, this.normalizeDoetPayload(itemDto), doet);
    const created: any = (result as any)?.data || result;
    if (created?.id && created?.taxCode) {
      const credentials = await this.createUserForDoet(created);
      if (credentials && (result as any).data) {
        (result as any).data.generatedAccount = credentials;
      }
    }
    return result;
  }

  async put(currentUser: any, id: string, itemDto: any) {
    try {
      const normalizedData = this.normalizeDoetPayload(itemDto);
      
      // Admin check for status field
      if (normalizedData && normalizedData.status !== undefined) {
        const roleName = (currentUser?.realRole || '').toUpperCase();
        const roleCode = (currentUser?.role?.role || '').toUpperCase();
        const isAdmin = roleName.includes('ADMIN') || roleCode.includes('ADMIN') || 
                        roleName.includes('QUẢN TRỊ') || roleName.includes('QUAN TRI');
        
        if (!isAdmin) {
          delete normalizedData.status;
        }
      }

      const updateData = {
        ...normalizedData,
        id: Number(id),
        updatedAt: new Date(),
        updatedBy: currentUser?.id
      };

      // Use save() instead of super.put()'s update() to handle relations correctly
      const saved = await this.doetRepository.save(updateData);
      
      // Sync status to associated users (asynchronous, don't block the response)
      if (itemDto && itemDto.status !== undefined) {
        const isActive = (itemDto.status === true || itemDto.status === 'true' || itemDto.status === 'ACTIVE');
        this.userRepository.update(
          { doet_id: Number(id) as any },
          { status: isActive }
        ).catch(err => {
          console.error(`Lỗi khi đồng bộ trạng thái sang tài khoản người dùng của doanh nghiệp ${id}:`, err);
        });
      }
      
      return Response.get(saved);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async delete(currentUser: any, id: string) {
    const result = await super.delete(currentUser, id);
    await this.deleteUsersOfDoets([id]);
    return result;
  }

  async deletes(currentUser: any, ids: string[], doetCtx: Doet | null) {
    const result = await super.deletes(currentUser, ids, doetCtx);
    await this.deleteUsersOfDoets(ids);
    return result;
  }

  async destroy(id: string) {
    const result = await super.destroy(id);
    await this.deleteUsersOfDoets([id]);
    return result;
  }

  async destroys(currentUser: any, ids: string[], doetCtx: Doet | null) {
    const result = await super.destroys(currentUser, ids, doetCtx);
    await this.deleteUsersOfDoets(ids);
    return result;
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

  async getDistinctWards(): Promise<{ key: any; value: string }[]> {
    const rows = await this.doetRepository
      .createQueryBuilder("doet")
      .select("doet.ward", "ward")
      .where("doet.deletedAt IS NULL")
      .andWhere("doet.ward IS NOT NULL")
      .getRawMany<{ ward: any }>();

    const map = new Map<string, { key: any; value: string }>();
    for (const row of rows) {
      const w = row.ward;
      if (!w) continue;
      const key = String(w.key ?? "").trim();
      const value = String(w.value ?? "").trim();
      if (!value) continue;
      const dedupeKey = key || value;
      if (!map.has(dedupeKey)) {
        map.set(dedupeKey, { key: w.key, value: w.value });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.value).localeCompare(String(b.value), "vi"),
    );
  }

  async checkEmailExists(email: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!email || !email.trim()) return { exists: false };
    const emailTrimmed = email.trim();

    // Check in Doets table
    const qbDoet = this.doetRepository
      .createQueryBuilder('doet')
      .where('doet.email = :email', { email: emailTrimmed })
      .andWhere('doet.deletedAt IS NULL');
    if (excludeId) qbDoet.andWhere('doet.id <> :id', { id: excludeId });
    const foundInDoet = await qbDoet.getOne();

    if (foundInDoet) return { exists: true };

    // Check in Users table
    const qbUser = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: emailTrimmed });
    
    // If updating a Doet, we should also exclude the email of the User currently linked to this Doet
    if (excludeId) {
      qbUser.andWhere('user.doet_id <> :id', { id: excludeId });
    }
    
    const foundInUser = await qbUser.getOne();

    return { exists: !!foundInUser };
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
    const { name, taxCode, loaiHinhId, businessLineId, wardId, status, page = 1, limit = 10 } = query;
    
    const qb = this.doetRepository.createQueryBuilder('doet')
      .leftJoinAndSelect('doet.loaiHinhKinhDoanh', 'loaiHinhKinhDoanh')
      .leftJoinAndSelect('doet.businessLine', 'businessLine')
      .where('doet.deletedAt IS NULL');

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

    if (wardId) {
      qb.andWhere("doet.ward ->> 'key' = :wardId", { wardId: String(wardId) });
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpired = new Date();
    otpExpired.setMinutes(otpExpired.getMinutes() + 5);

    await this.doetRepository.update(doet.id, { otp, otpExpired });

    console.log(`[SIMULATED EMAIL] Mã OTP đổi mật khẩu cho ${doet.name} là: ${otp}`);

    return { success: true, message: "Đã gửi mã OTP thành công", otp: otp };
  }

  async changePassword(id: number, oldPassword: string, otp: string, newPassword: string) {
    const users = await this.manager.query(`SELECT * FROM users WHERE doet_id = $1`, [id]);
    if (!users || users.length === 0) throw Response.errorNotFound("Không tìm thấy tài khoản của doanh nghiệp");

    const user = users[0];
    const isMatch = await argon.verify(user.password, oldPassword);
    if (!isMatch) throw Response.errorBad("Mật khẩu cũ không chính xác");

    const doet = await this.doetRepository.findOne({ where: { id } });
    if (!doet) throw Response.errorNotFound("Không tìm thấy doanh nghiệp");
    if (!doet.otp || doet.otp !== otp) throw Response.errorBad("Mã OTP không chính xác");
    if (new Date() > new Date(doet.otpExpired)) throw Response.errorBad("Mã OTP đã hết hạn");

    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, id]);

    await this.doetRepository.update(id, { otp: null, otpExpired: null });
    return { success: true, message: "Đổi mật khẩu thành công" };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const doet = await this.doetRepository.findOne({ where: { email } });
    if (!doet) throw Response.errorNotFound("Không tìm thấy doanh nghiệp với email này");
    if (!doet.otp || doet.otp !== otp) throw Response.errorBad("Mã OTP không chính xác");
    if (new Date() > new Date(doet.otpExpired)) throw Response.errorBad("Mã OTP đã hết hạn");

    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, doet.id]);

    await this.doetRepository.update(doet.id, { otp: null, otpExpired: null });
    return { success: true, message: "Khôi phục mật khẩu thành công" };
  }

  async adminResetPassword(id: number, newPassword: string) {
    const users = await this.manager.query(`SELECT id FROM users WHERE doet_id = $1`, [id]);
    if (!users || users.length === 0) throw Response.errorNotFound("Không tìm thấy tài khoản của doanh nghiệp");

    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, id]);

    return { success: true, message: "Cấp lại mật khẩu thành công" };
  }

  async importExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const loaiHinhs = await this.manager.find(LoaiHinhKinhDoanh);
    const businessLines = await this.manager.find(BusinessLine);

    const items: any[] = [];

    const getCellValue = (cell: ExcelJS.Cell): string => {
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && 'richText' in cell.value) return cell.text.trim();
      return String(cell.value).trim();
    };

    const rows: ExcelJS.Row[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) rows.push(row);
    });

    for (const row of rows) {
      const name = getCellValue(row.getCell(1));
      const taxCode = getCellValue(row.getCell(2));
      const email = getCellValue(row.getCell(3));
      const loaiHinhCode = getCellValue(row.getCell(4));
      const businessLineCode = getCellValue(row.getCell(5));
      const provinceName = getCellValue(row.getCell(6));
      const wardName = getCellValue(row.getCell(7));
      const address = getCellValue(row.getCell(8));
      const name2 = getCellValue(row.getCell(9));
      const gpkdDateRaw = row.getCell(10).value;
      const officePhone = getCellValue(row.getCell(11));
      const operatingProvinceName = getCellValue(row.getCell(12));
      const operatingWardName = getCellValue(row.getCell(13));
      const operatingAddress = getCellValue(row.getCell(14));
      const headOfEnterprise = getCellValue(row.getCell(15));
      const headPhone = getCellValue(row.getCell(16));

      if (!name && !taxCode && !email) continue; // Skip truly empty rows

      const errors: string[] = [];

      // 1. Mandatory checks
      if (!name) errors.push('Tên doanh nghiệp không được để trống');
      if (!taxCode) errors.push('Mã số thuế không được để trống');
      if (!email) errors.push('Email không được để trống');
      if (!loaiHinhCode) errors.push('Mã loại hình không được để trống');
      if (!businessLineCode) errors.push('Mã ngành nghề không được để trống');
      if (!provinceName) errors.push('Tỉnh/Thành ĐKKD không được để trống');
      if (!wardName) errors.push('Phường/Xã ĐKKD không được để trống');
      if (!address) errors.push('Địa chỉ ĐKKD không được để trống');

      // 2. Format checks
      if (taxCode && !/^\d{10}(-\d{3})?$/.test(taxCode)) {
        errors.push('Mã số thuế không đúng định dạng (10 hoặc 13 số)');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email không đúng định dạng');
      }

      // 3. Robust matching for Loai Hinh
      const loaiHinh = loaiHinhs.find(lh => 
        (lh.maloaihinh && loaiHinhCode && lh.maloaihinh.toUpperCase() === loaiHinhCode.toUpperCase()) ||
        (lh.tenloaihinh && loaiHinhCode && lh.tenloaihinh.toLowerCase().includes(loaiHinhCode.toLowerCase()))
      );
      if (loaiHinhCode && !loaiHinh) errors.push(`Không tìm thấy loại hình có mã/tên: ${loaiHinhCode}`);
      
      // 4. Robust matching for Business Line
      const businessLine = businessLines.find(bl => {
        if (!businessLineCode) return false;
        if (bl.manganh && bl.manganh.toUpperCase() === businessLineCode.toUpperCase()) return true;
        const cleanBlManganh = bl.manganh?.replace(/[^a-zA-Z0-9]/g, '') || '';
        const cleanInputCode = businessLineCode.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanBlManganh && cleanInputCode && cleanBlManganh === cleanInputCode) return true;
        if (bl.tennganh && bl.tennganh.toLowerCase().includes(businessLineCode.toLowerCase())) return true;
        return false;
      });
      if (businessLineCode && !businessLine) errors.push(`Không tìm thấy ngành nghề có mã/tên: ${businessLineCode}`);

      // 5. Uniqueness checks (Tax Code & Email)
      if (taxCode && errors.length === 0) {
        const existingTaxCode = await this.doetRepository.findOne({ where: { taxCode } });
        if (existingTaxCode) errors.push(`Mã số thuế ${taxCode} đã được đăng ký`);
      }
      if (email && errors.length === 0) {
        const checkEmail = await this.checkEmailExists(email);
        if (checkEmail.exists) errors.push(`Email ${email} đã tồn tại trong hệ thống`);
      }

      // 6. Robust date parsing
      let gpkdDate: Date | null = null;
      if (gpkdDateRaw instanceof Date) {
        gpkdDate = gpkdDateRaw;
      } else if (typeof gpkdDateRaw === 'string' || typeof gpkdDateRaw === 'number') {
        const d = new Date(gpkdDateRaw);
        if (!isNaN(d.getTime())) gpkdDate = d;
      }

      items.push({
        name,
        taxCode,
        email,
        loaiHinhId: loaiHinh?.id,
        businessLineId: businessLine?.id,
        provinceName, 
        wardName,
        address,
        name2,
        gpkdDate,
        officePhone,
        operatingProvinceName,
        operatingWardName,
        operatingAddress,
        headOfEnterprise,
        headPhone,
        status: 'ACTIVE',
        errors // Return errors if any
      });
    }

    return items;
  }
}
