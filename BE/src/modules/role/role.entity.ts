import { BaseEntity } from 'src/commons';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../user/user.entity';
import { Permission } from '../permission/permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  constructor(
    roles?: Partial<Role>,
    keys: string[] = ['id', 'role', 'name', 'users', 'type', 'status', 'permissions'],
  ) {
    super(roles);
    roles &&
      keys.forEach((key) => {
        roles[key] !== undefined && (this[key] = roles[key]);
      });
  }
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { unique: true })
  role: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  type: string;

  @Column('varchar', { nullable: true })
  status: boolean;

  @OneToMany(() => User, (user: User) => user.role, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  users: Array<User>;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_code', referencedColumnName: 'code' },
  })
  permissions: Permission[];
}

