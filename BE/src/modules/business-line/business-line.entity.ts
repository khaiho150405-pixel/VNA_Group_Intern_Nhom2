import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Doet } from '../doet/doet.entity';

@Entity('business_line')
export class BusinessLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_nganh', type: 'varchar', length: 50, unique: true })
  manganh: string;

  @Column({ name: 'ten_nganh', type: 'varchar', length: 255 })
  tennganh: string;

  // Cấp từ 1 tới 4
  @Column({ name: 'cap', type: 'int' })
  cap: number;

  @Column({ name: 'trang_thai', type: 'varchar', length: 50, default: 'ACTIVE' })
  trangthai: string;

  @OneToMany(() => Doet, (doet) => doet.businessLine)
  doets: Doet[];
}