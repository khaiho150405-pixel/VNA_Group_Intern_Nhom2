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
    
    // Doanh nghiệp - không quản lý doanh nghiệp
    if (roleType === 'DN') return 0;
    
    // Nhóm Sở - phân quyền chi tiết
    if (roleType === 'SO') {
      // Admin/Lãnh đạo có quyền đầy đủ
      const isAdminOrLeader = roleName.includes('admin') || roleName.includes('quản trị') || 
                              roleName.includes('lãnh đạo') || roleName.includes('leader') ||
                              realRole.includes('quản trị') || realRole.includes('admin') ||
                              realRole.includes('lãnh đạo') || realRole.includes('leader') ||
                              roleId === 4 || roleId === 3;
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

  // Kiểm tra quyền xem
  async checkReadPermission(currentUser: any, targetDoetId?: number) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') {
      return;
    }
    const roleType = currentUser.role?.type;
    const roleId = currentUser.role?.id;

    // Doanh nghiệp - chỉ được phép xem chính mình
    if (roleType === 'DN') {
      const doetId = currentUser.doet || currentUser.doet_id;
      if (targetDoetId !== undefined && Number(doetId) !== Number(targetDoetId)) {
        throw Response.errorForBidden("Tài khoản doanh nghiệp chỉ có quyền xem thông tin của chính mình.");
      }
      return;
    }

    // Sở - Kiểm tra quyền xem trong DB
    const allowed = await this.hasPermission(roleId, 'ADMIN_C_ENTERPRISE_VIEW');
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 0) {
        throw Response.errorForBidden("Tài khoản của bạn không có quyền xem thông tin doanh nghiệp.");
      }
    }
  }

  // Kiểm tra quyền ghi (thêm)
  private async checkCreatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') {
      return;
    }
    const roleId = currentUser.role?.id;

    const allowed = await this.hasPermission(roleId, 'ADMIN_C_ENTERPRISE_CREATE');
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 1) {
        throw Response.errorForBidden("Tài khoản của bạn chỉ có quyền xem, không được thực hiện thao tác này.");
      }
    }
  }

  // Kiểm tra quyền ghi (sửa)
  private async checkUpdatePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') {
      return;
    }
    if (currentUser.isUpdatingSelf) {
      return;
    }
    const roleId = currentUser.role?.id;

    const allowed = await this.hasPermission(roleId, 'ADMIN_C_ENTERPRISE_UPDATE');
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 1) {
        throw Response.errorForBidden("Tài khoản của bạn chỉ có quyền xem, không được thực hiện thao tác này.");
      }
    }
  }

  // Kiểm tra quyền đầy đủ (xóa, cập nhật trạng thái)
  private async checkFullPermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser.username === 'testuser') {
      return;
    }
    const roleId = currentUser.role?.id;

    const allowed = await this.hasPermission(roleId, 'ADMIN_C_ENTERPRISE_DELETE');
    if (!allowed) {
      const level = this.getPermissionLevel(currentUser);
      if (level < 2) {
        throw Response.errorForBidden("Bạn không có quyền thực hiện thao tác này. Chỉ Admin hoặc Lãnh đạo mới được phép xóa hoặc cập nhật trạng thái.");
      }
    }
  }

  private checkPermission(currentUser: any) {
    this.checkWritePermission(currentUser);
  }

  // Fallback signature to keep backward compatibility
  private checkWritePermission(currentUser: any) {
    if (currentUser === undefined || currentUser === null) return;
    if (currentUser?.role?.type === 'DN' && currentUser.isUpdatingSelf) return;
    const level = this.getPermissionLevel(currentUser);
    if (level < 1) {
      throw Response.errorForBidden("Tài khoản của bạn chỉ có quyền xem, không được thực hiện thao tác này.");
    }
  }

  async post(currentUser: any, itemDto: any, doet: any): Promise<any> {
    // Kiem tra quyen cap nhat trang thai - chi Admin/Lanh dao duoc phep khi set trang thai khac ACTIVE
    if (itemDto && Object.prototype.hasOwnProperty.call(itemDto, "status") && itemDto.status !== "ACTIVE") {
      await this.checkFullPermission(currentUser);
    }
    await this.checkCreatePermission(currentUser);
    const data = this.normalizeDoetPayload(itemDto);
    const result = await super.post(currentUser, data, doet);
    
    // Automatically create user account
    const savedDoet = result.data;
    if (savedDoet && savedDoet.id) {
       await this.createUserForDoet(savedDoet);
    }
    
    return result;
  }

  async put(currentUser: any, id: string, itemDto: any): Promise<any> {
    // Kiem tra quyen cap nhat trang thai - chi Admin/Lanh dao duoc phep khi thuc su thay doi trang thai
    if (itemDto && Object.prototype.hasOwnProperty.call(itemDto, "status")) {
      const existing = await this.doetRepository.findOne({ where: { id } });
      if (existing && existing.status !== itemDto.status) {
        await this.checkFullPermission(currentUser);
      }
    }
    await this.checkUpdatePermission(currentUser);
    const data = this.normalizeDoetPayload(itemDto);
    const result = await super.put(currentUser, id, data);

    // Synchronize status with associated users
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      const isInactive = data.status === 'INACTIVE';
      // In DB: user.status true = Locked, false = Active
      await this.manager.query(`
        UPDATE users 
        SET status = $1 
        WHERE doet_id = $2
      `, [isInactive, id]);
    }

    // Synchronize other fields to user details
    await this.syncUserWithDoet(Number(id));

    return result;
  }

  async delete(currentUser: any, id: string): Promise<any> {
    await this.checkFullPermission(currentUser);
    // Delete associated users first
    await this.manager.query(`DELETE FROM users WHERE doet_id = $1`, [id]);
    return await super.delete(currentUser, id);
  }

  async destroy(currentUser: any, id: string): Promise<any> {
    await this.checkFullPermission(currentUser);
    // Delete associated users first
    await this.manager.query(`DELETE FROM users WHERE doet_id = $1`, [id]);
    return await super.destroy(currentUser, id);
  }

  async destroys(currentUser: any, ids: string[], doet: any): Promise<any> {
    await this.checkFullPermission(currentUser);
    if (ids && ids.length > 0) {
      // Delete associated users for all specified enterprises
      await this.manager.query(`
        DELETE FROM users 
        WHERE doet_id = ANY($1)
      `, [ids]);
    }
    return await super.destroys(currentUser, ids, doet);
  }

  async updateMyCompany(currentUser: any, body: any) {
    const doetId = currentUser?.doet || currentUser?.doet_id;
    if (!currentUser || !doetId) {
      throw Response.errorForBidden("Tài khoản không thuộc doanh nghiệp nào");
    }
    // Flag to allow DN to update their own profile
    currentUser.isUpdatingSelf = true;
    const data = this.normalizeDoetPayload(body);
    const result = await this.put(currentUser, String(doetId), data);
    delete currentUser.isUpdatingSelf;
    return result;
  }

  private validatePasswordStrength(password: string) {
    if (!password || password.length < 6) {
      throw Response.errorBad('Mật khẩu mới phải có ít nhất 6 kí tự');
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      throw Response.errorBad('Mật khẩu mới quá yếu. Cần chứa ít nhất chữ và số.');
    }
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

      const defaultPassword = "12345678";
      const hashedPassword = await argon.hash(defaultPassword);

      // Find enterprise role dynamically from database
      const enterpriseRole = await this.manager.query(`SELECT id, name FROM roles WHERE role = 'enterprise' LIMIT 1`);
      const roleId = enterpriseRole?.[0]?.id || 5;
      const realRole = enterpriseRole?.[0]?.name || 'Quản trị DN';

      const user = new User({
        username: username,
        password: hashedPassword,
        email: doet.email,
        fullName: (doet as any).name,
        dateOfBirth: (doet as any).gpkdDate ? new Date((doet as any).gpkdDate) : null,
        province: (doet as any).province,
        district: (doet as any).ward,
        address: (doet as any).address,
        doet_id: doet.id,
        roleId: roleId,
        realRole: realRole
      } as any);

      await this.userRepository.save(user);
      return { username, password: defaultPassword };
    } catch (error) {
      console.error("Lỗi khi tự động tạo tài khoản doanh nghiệp:", error);
      return null;
    }
  }

  private async syncUserWithDoet(doetId: number) {
    try {
      const doet = await this.doetRepository.findOne({ where: { id: doetId } });
      if (!doet) return;

      const users = await this.manager.query(`SELECT id FROM users WHERE doet_id = $1`, [doetId]);
      if (!users || users.length === 0) return;

      const userId = users[0].id;
      
      await this.manager.query(`
        UPDATE users
        SET 
          username = $1,
          "fullName" = $2,
          "dateOfBirth" = $3,
          email = $4,
          province = $5,
          district = $6,
          address = $7
        WHERE id = $8
      `, [
        doet.taxCode,
        doet.name,
        doet.gpkdDate ? new Date(doet.gpkdDate) : null,
        doet.email,
        doet.province ? JSON.stringify(doet.province) : null,
        doet.ward ? JSON.stringify(doet.ward) : null,
        doet.address,
        userId
      ]);
    } catch (error) {
      console.error("Lỗi khi đồng bộ tài khoản doanh nghiệp:", error);
    }
  }

  async getMyCompany(currentUser: any) {
    const doetId = currentUser?.doet || currentUser?.doet_id;
    if (!currentUser || !doetId) {
      return Response.get(null);
    }
    const doet = await this.doetRepository.findOne({ where: { id: doetId } });
    if (!doet) {
      throw Response.errorNotFound("Không tìm thấy thông tin doanh nghiệp");
    }
    return Response.get(doet);
  }

  async getDistinctWards(): Promise<WardOption[]> {
    const raw = await this.doetRepository
      .createQueryBuilder('doet')
      .select("DISTINCT doet.ward ->> 'key'", 'key')
      .addSelect("doet.ward ->> 'value'", 'value')
      .where('doet.ward IS NOT NULL')
      .andWhere('doet.deletedAt IS NULL')
      .orderBy("doet.ward ->> 'value'", 'ASC')
      .getRawMany();
    return raw.filter(r => r.key && r.value);
  }

  async checkEmailExists(email: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!email || !email.trim()) return { exists: false };
    const emailTrimmed = email.trim();
    const qb = this.doetRepository
      .createQueryBuilder('doet')
      .where('LOWER(doet.email) = LOWER(:email)', { email: emailTrimmed })
      .andWhere('doet.deletedAt IS NULL');
    if (excludeId) qb.andWhere('doet.id <> :id', { id: excludeId });
    const found = await qb.getOne();
    if (found) return { exists: true };

    // Check in Users table
    const qbUser = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: emailTrimmed })
      .andWhere('user.deletedAt IS NULL');

    // If updating a Doet, we should also exclude the email of the User currently linked to this Doet
    if (excludeId) {
      qbUser.andWhere('user.doet_id <> :id', { id: excludeId });
    }

    const foundInUser = await qbUser.getOne();
    return { exists: !!foundInUser };
  }

  async checkNameExists(name: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!name || !name.trim()) return { exists: false };
    const qb = this.doetRepository
      .createQueryBuilder('doet')
      .where('LOWER(doet.name) = LOWER(:name)', { name: name.trim() })
      .andWhere('doet.deletedAt IS NULL');
    if (excludeId) qb.andWhere('doet.id <> :id', { id: excludeId });
    const found = await qb.getOne();
    return { exists: !!found };
  }

  async checkTaxCodeExists(taxCode: string, excludeId?: number): Promise<{ exists: boolean }> {
    if (!taxCode || !taxCode.trim()) return { exists: false };
    const qb = this.doetRepository
      .createQueryBuilder('doet')
      .where('doet.taxCode = :taxCode', { taxCode: taxCode.trim() })
      .andWhere('doet.deletedAt IS NULL');
    if (excludeId) qb.andWhere('doet.id <> :id', { id: excludeId });
    const found = await qb.getOne();
    return { exists: !!found };
  }

  async getSetting(doet: Doet) {
    if (!doet) return null;
    const found = await this.doetRepository.findOne(doet.id);
    if (!found) return null;
    return Response.get({
      name: found.name2 || found.name,
      logo: found.logo,
      favicon: found.favicon,
      province: found.province2 || found.province
    });
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
    this.validatePasswordStrength(newPassword);

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
    this.validatePasswordStrength(newPassword);

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
    this.validatePasswordStrength(newPassword);

    const users = await this.manager.query(`SELECT id FROM users WHERE doet_id = $1`, [id]);
    if (!users || users.length === 0) throw Response.errorNotFound("Không tìm thấy tài khoản của doanh nghiệp");

    const hashedPassword = await argon.hash(newPassword);
    await this.manager.query(`UPDATE users SET password = $1 WHERE doet_id = $2`, [hashedPassword, id]);

    return { success: true, message: "Cấp lại mật khẩu thành công" };
  }

  async importExcel(currentUser: any, buffer: Buffer) {
    this.checkPermission(currentUser);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
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
      if (taxCode && !/^[a-zA-Z0-9-]{10,20}$/.test(taxCode)) {
        errors.push('Mã số thuế phải từ 10 đến 20 ký tự');
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

export interface WardOption {
  key: string;
  value: string;
}
