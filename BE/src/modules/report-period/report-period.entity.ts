import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("report_periods")
export class ReportPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "year", type: "int" })
  year: number;

  @Column({ name: "report_name", type: "varchar", length: 255 })
  reportName: string;

  @Column({ name: "period", type: "varchar", length: 50 })
  period: string; // '6_THANG' | 'CA_NAM'

  @Column({ name: "start_date", type: "timestamp" })
  startDate: Date;

  @Column({ name: "end_date", type: "timestamp" })
  endDate: Date;

  @Column({ name: "status", type: "varchar", length: 50, default: "ACTIVE" })
  status: string; // 'ACTIVE' | 'INACTIVE'

  @Column({ name: "created_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
