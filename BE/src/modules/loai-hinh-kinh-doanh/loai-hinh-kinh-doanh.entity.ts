import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Doet } from '../doet/doet.entity';

@Entity('loai_hinh_kinh_doanh')
export class LoaiHinhKinhDoanh {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ma_loai_hinh', type: 'varchar', length: 50, unique: true })
  maloaihinh: string;

  @Column({ name: 'ten_loai_hinh', type: 'varchar', length: 255 })
  tenloaihinh: string;

  @Column({ name: 'trang_thai', type: 'varchar', length: 50, default: 'ACTIVE' })
  trangthai: string;

  @OneToMany(() => Doet, (doet) => doet.loaiHinhKinhDoanh)
  doets: Doet[];
}
