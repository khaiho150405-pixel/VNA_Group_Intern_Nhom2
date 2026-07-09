import { BaseEntity } from "src/commons";
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert
} from "typeorm";
import { Role } from "../role/role.entity";
import * as argon from "argon2";
import { BaseAddressEntity } from "src/commons/bases/baseAddressEntity";
export enum Gender {
  female,
  male,
}

@Entity("users")
export class User extends BaseAddressEntity {
  constructor(
    users?: Partial<User>,
    keys: string[] = [
      "id",
      "username",
      "password",
      "fullName",
      "realRole",
      "role",
      "roleId",
      "gender",
      "avatar",
      "email",
      "unitId",
      "dateOfBirth",
      "status",
      "doet_id",
      "deletedAt",
      "otp",
      "otpExpired",
      "workUnit",
      "allowedRoles"
    ]
  ) {
    super(users as any);
    users &&
      keys.forEach((key) => {
        (users as any)[key] !== undefined && ((this as any)[key] = (users as any)[key]);
      });
  }

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("varchar", { unique: true })
  username!: string;

  @Column("varchar")
  password!: string;

  @Column({ nullable: true })
  fullName!: string;

  @Column("varchar", { nullable: true })
  realRole!: string;

  @Column({ nullable: true })
  gender!: Gender;

  @Column({ nullable: true })
  avatar!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  dateOfBirth!: Date;

  @Column({ nullable: true })
  status!: boolean;

  @Column({ nullable: true })
  otp!: string;

  @Column({ type: "timestamp", nullable: true })
  otpExpired!: Date;

  @Column({ nullable: true })
  unitId!: number;

  @Column({ nullable: true })
  deletedAt!: Date;

  @Column({ nullable: true })
  doet_id!: number;

  @Column({ nullable: true })
  roleId!: number;

  @ManyToOne(() => Role, (role: Role) => role.users)
  @JoinColumn({ name: "roleId" })
  role!: Role;

  @BeforeInsert()
  async hashPassword() {
    if (this.password && !this.password.startsWith("$argon2")) {
      this.password = await argon.hash(this.password);
    }
  }

  @Column({ nullable: true })
  workUnit!: string;

  @Column("simple-array", { nullable: true })
  allowedRoles!: string[];
}
