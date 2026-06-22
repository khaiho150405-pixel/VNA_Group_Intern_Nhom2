import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { PeriodicReport } from "./periodic-report.entity";

@Entity("accident_details")
export class AccidentDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PeriodicReport, (report) => report.accidentDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "report_id" })
  report: PeriodicReport;

  @Column({ name: "report_type", type: "varchar", length: 50 })
  reportType: string;

  @Column({ name: "nguyen_nhan_id", type: "int", nullable: true })
  nguyenNhanId: number;

  @Column({ name: "yeu_to_chan_thuong_id", type: "int", nullable: true })
  yeuToChanThuongId: number;

  @Column({ name: "nghe_nghiep_id", type: "int", nullable: true })
  ngheNghiepId: number;

  @Column({ type: "jsonb", nullable: true })
  stats: any;
}
