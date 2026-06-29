import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { PeriodicReport } from "./periodic-report.entity";

@Entity("periodic_report_histories")
export class PeriodicReportHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PeriodicReport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "report_id" })
  report: PeriodicReport;

  @Column({ name: "report_id" })
  reportId: number;

  @Column({ name: "status", type: "varchar", length: 50 })
  status: string;

  @Column({ name: "user_id", type: "varchar", length: 36, nullable: true })
  userId: string;

  @Column({ name: "user_name", type: "varchar", length: 255, nullable: true })
  userName: string;

  @Column({ name: "user_role", type: "varchar", length: 50, nullable: true })
  userRole: string;

  @Column({ name: "reject_reason", type: "text", nullable: true })
  rejectReason: string;

  @Column({ name: "created_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
