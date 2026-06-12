import { BaseAddressEntity, KeyValue } from "src/commons/bases/baseAddressEntity";
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate, AfterInsert, getManager } from "typeorm";
import { LoaiHinhKinhDoanh } from "../loai-hinh-kinh-doanh/loai-hinh-kinh-doanh.entity";
import { BusinessLine } from "../business-line/business-line.entity";
import { IsEmail, IsNotEmpty, Matches, validate } from "class-validator";
import { BadRequestException } from "@nestjs/common";
import * as argon from "argon2";

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
    ];
    doet &&
    keys.forEach((key) => {
      doet[key] !== undefined && (this[key] = doet[key]);
    });
  }

  // Tự động kích hoạt kiểm tra (validate) ngay trước khi Insert hoặc Update
  @BeforeInsert()
  @BeforeUpdate()
  async validateData() {
    const errors = await validate(this);
    
    // Bỏ qua lỗi của trường phone (do kế thừa từ BaseAddressEntity)
    const filteredErrors = errors.filter(err => err.property !== 'phone');
    
    if (filteredErrors.length > 0) {
      const messages = filteredErrors.reduce((acc, err) => acc.concat(Object.values(err.constraints || {})), [] as string[]);
      throw new BadRequestException(messages);
    }

    // Ràng buộc Mã số thuế không được trùng lặp
    if (this.taxCode) {
      const manager = getManager();
      const existing = await manager.findOne(Doet, { where: { taxCode: this.taxCode } });
      if (existing && existing.id !== this.id) {
        throw new BadRequestException(["Mã số thuế này đã tồn tại trong hệ thống"]);
      }
    }
  }

  // Tự động tạo tài khoản sau khi lưu thành công Doanh nghiệp mới
  @AfterInsert()
  async createDefaultUser() {
    if (this.taxCode && this.id) {
      try {
        const manager = getManager();
        
        // Loại bỏ dấu '-' (nếu có ở đuôi chi nhánh) và lấy 6 số cuối cùng làm mật khẩu
        const plainTaxCode = this.taxCode.replace('-', '');
        const defaultPassword = plainTaxCode.slice(-6);
        const hashedPassword = await argon.hash(defaultPassword);
        
        await manager.query(
          `INSERT INTO users (username, password, email, doet_id) VALUES ($1, $2, $3, $4)`,
          [this.taxCode, hashedPassword, this.email, this.id]
        );
      } catch (error) {
        console.error("Lỗi khi tự động tạo tài khoản doanh nghiệp:", error);
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
  @Matches(/^\d{10}(-\d{3})?$/, { message: 'Mã số thuế không hợp lệ (Gồm 10 hoặc 13 số, VD: 0101234567 hoặc 0101234567-001)' })
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

  @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống' })
  province: KeyValue;

  @IsNotEmpty({ message: 'Phường/xã không được để trống' })
  ward: KeyValue;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: "timestamp", nullable: true })
  otpExpired: Date;
}
