import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('occupation')
export class Occupation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_nghe', type: 'varchar', length: 50, unique: true })
  manghe: string;

  @Column({ name: 'ten_nghe', type: 'varchar', length: 255 })
  tennghe: string;

  // Cấp từ 1 tới 4
  @Column({ name: 'cap', type: 'int' })
  cap: number;

  @Column({ name: 'trang_thai', type: 'varchar', length: 50, default: 'ACTIVE' })
  trangthai: string;
}
