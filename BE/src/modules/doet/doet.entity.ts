import { BaseAddressEntity, KeyValue } from "src/commons/bases/baseAddressEntity";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate, getManager } from "typeorm";
import { LoaiHinhKinhDoanh } from "../loai-hinh-kinh-doanh/loai-hinh-kinh-doanh.entity";
import { BusinessLine } from "../business-line/business-line.entity";
import { IsEmail, IsNotEmpty, Matches, validate } from "class-validator";
import { BadRequestException } from "@nestjs/common";
import { User } from "../user/user.entity";

@Entity("doets")
export class Doet extends BaseAddressEntity {
  constructor(doet: Partial<Doet>) {
    super(doet);
    const keys = [
      "id",
      "name",
      "name2",
      "parentId",
      "domain",
      "logo",
      "favicon",
      "province",
      "province2",
      "taxCode",
      "status",
      "loaiHinhKinhDoanh",
      "businessLine",
      "email",
      "otp",
      "otpExpired",
      "gpkdDate",
      "officePhone",
      "headOfEnterprise",
      "headPhone",
      "operatingAddress",
      "operatingWard",
      "operatingDistrict",
      "operatingProvince",
      "attachments",
    ];
    doet &&
    keys.forEach((key) => {
      doet[key] !== undefined && (this[key] = doet[key]);
    });
  }

  @BeforeInsert()
  @BeforeUpdate()
  async validateData() {
    // Nếu không có taxCode, có thể đây là dữ liệu cũ hoặc nút cha trong cây, cho phép bỏ qua validate chặt
    if (!this.taxCode) return;

    // Kiểm tra định dạng Mã số thuế theo nghiệp vụ mới
    const trimmed = this.taxCode.trim();
    const digits = trimmed.replace(/-/g, '');
    const isDigitsOnlyAndHyphens = /^[0-9-]+$/.test(trimmed);
    const hasCorrectLength = digits.length >= 10 && digits.length <= 20;
    
    // Nếu có 13 chữ số, bắt buộc 3 số cuối nằm sau dấu gạch ngang (-)
    const is13DigitValid = digits.length === 13 ? /^\d{10}-\d{3}$/.test(trimmed) : true;
    
    // Nếu có độ dài khác và chứa dấu gạch ngang, đảm bảo chỉ có tối đa 1 dấu và không ở đầu/cuối
    let isOtherHyphenValid = true;
    if (digits.length !== 13 && trimmed.includes('-')) {
      const hyphenCount = (trimmed.match(/-/g) || []).length;
      isOtherHyphenValid = (hyphenCount === 1 && !trimmed.startsWith('-') && !trimmed.endsWith('-'));
    }

    if (!isDigitsOnlyAndHyphens || !hasCorrectLength || !is13DigitValid || !isOtherHyphenValid) {
      throw new BadRequestException(["Mã số thuế không hợp lệ (Gồm 10 đến 20 số, nếu có 13 số thì bắt buộc dùng dấu gạch ngang phân tách 3 số cuối, VD: 0101234567-001)"]);
    }

    const errors = await validate(this);
    
    // Bỏ qua lỗi của trường phone và taxCode (vì đã check custom ở trên)
    const filteredErrors = errors.filter(err => err.property !== 'phone' && err.property !== 'taxCode');
    
    if (filteredErrors.length > 0) {
      const messages = filteredErrors.reduce((acc, err) => acc.concat(Object.values(err.constraints || {})), [] as string[]);
      throw new BadRequestException(messages);
    }

    // Ràng buộc Mã số thuế không được trùng lặp
    const manager = getManager();
    const existing = await manager.findOne(Doet, { where: { taxCode: this.taxCode } });
    if (existing && existing.id !== this.id) {
      throw new BadRequestException(["Mã số thuế này đã tồn tại trong hệ thống"]);
    }

    // Ràng buộc Email không được trùng lặp trong hệ thống (cả doanh nghiệp và người dùng)
    if (this.email) {
      const emailTrimmed = this.email.trim();
      
      // 1. Kiểm tra trong bảng Doets (Doanh nghiệp)
      const qbDoet = manager.createQueryBuilder(Doet, 'doet')
        .where('LOWER(doet.email) = LOWER(:email)', { email: emailTrimmed })
        .andWhere('doet.deletedAt IS NULL');
      if (this.id) {
        qbDoet.andWhere('doet.id <> :id', { id: this.id });
      }
      const existingDoetEmail = await qbDoet.getOne();
      if (existingDoetEmail) {
        throw new BadRequestException(["Email này đã được đăng ký trong hệ thống"]);
      }

      // 2. Kiểm tra trong bảng Users (Người dùng)
      const qbUser = manager.createQueryBuilder(User, 'user')
        .where('LOWER(user.email) = LOWER(:email)', { email: emailTrimmed })
        .andWhere('user.deletedAt IS NULL');
      if (this.id) {
        qbUser.andWhere('user.doet_id <> :id', { id: this.id });
      }
      const existingUserEmail = await qbUser.getOne();
      if (existingUserEmail) {
        throw new BadRequestException(["Email này đã được đăng ký trong hệ thống"]);
      }
    }
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ nullable: false })
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  name: string;

  @Column({ nullable: true })
  name2: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  favicon: string;

  @Column({ type: 'jsonb', nullable: true })
  province2: KeyValue;

  @Column({ name: 'tax_code', type: 'varchar', length: 50, nullable: true })
  @IsNotEmpty({ message: 'Mã số thuế không được để trống' })
  taxCode: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'ACTIVE' })
  status: string;

  @ManyToOne(() => LoaiHinhKinhDoanh, (loaiHinh) => loaiHinh.doets, { eager: true })
  @JoinColumn({ name: 'loai_hinh_id' })
  @IsNotEmpty({ message: 'Loại hình kinh doanh không được để trống' })
  loaiHinhKinhDoanh: LoaiHinhKinhDoanh;

  @ManyToOne(() => BusinessLine, (businessLine) => businessLine.doets, { eager: true })
  @JoinColumn({ name: 'business_line_id' })
  @IsNotEmpty({ message: 'Ngành nghề kinh doanh không được để trống' })
  businessLine: BusinessLine;

  @Column({ type: 'jsonb', nullable: true })
  @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống' })
  province: KeyValue;

  @Column({ type: 'jsonb', nullable: true })
  @IsNotEmpty({ message: 'Phường/xã không được để trống' })
  ward: KeyValue;

  @Column({ name: 'gpkd_date', type: 'timestamp', nullable: true })
  gpkdDate: Date;

  @Column({ name: 'office_phone', type: 'varchar', length: 50, nullable: true })
  officePhone: string;

  @Column({ name: 'head_of_enterprise', type: 'varchar', length: 255, nullable: true })
  headOfEnterprise: string;

  @Column({ name: 'head_phone', type: 'varchar', length: 50, nullable: true })
  headPhone: string;

  @Column({ name: 'operating_address', type: 'varchar', length: 255, nullable: true })
  operatingAddress: string;

  @Column({ name: 'operating_ward', type: 'jsonb', nullable: true })
  operatingWard: KeyValue;

  @Column({ name: 'operating_district', type: 'jsonb', nullable: true })
  operatingDistrict: KeyValue;

  @Column({ name: 'operating_province', type: 'jsonb', nullable: true })
  operatingProvince: KeyValue;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true })
  attachments: any[];

  @Column({ nullable: true })
  otp: string;

  @Column({ type: "timestamp", nullable: true })
  otpExpired: Date;
}
