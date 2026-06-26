import { Entity, Column, PrimaryColumn, ManyToMany } from 'typeorm';
import { Role } from '../role/role.entity';

@Entity('permissions')
export class Permission {
  constructor(data?: Partial<Permission>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  @PrimaryColumn({ name: 'code', type: 'varchar', length: 255 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'type', type: 'varchar', length: 50 })
  type: string; // 'Group' | 'Component'

  @Column({ name: 'parent_code', type: 'varchar', length: 255, nullable: true })
  parentCode: string;

  @Column({ name: 'order', type: 'int', default: 0 })
  order: number;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
