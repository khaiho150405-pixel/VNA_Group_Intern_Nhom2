import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { AccidentDetail } from "./accident-detail.entity";

@Entity("periodic_reports")
export class PeriodicReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "doet_id", type: "varchar", length: 36, nullable: true })
  doetId: string;

  @Column({ name: "year", type: "int" })
  year: number;

  @Column({ name: "period", type: "varchar", length: 50 })
  period: string;

  @Column({ name: "status", type: "varchar", length: 50, default: "DANG_BAO_CAO" })
  status: string;

  @Column({ name: "company_name", type: "varchar", length: 255, nullable: true })
  companyName: string;

  @Column({ name: "company_type_id", type: "int", nullable: true })
  companyTypeId: number;

  @Column({ name: "business_line_id", type: "int", nullable: true })
  businessLineId: number;

  @Column({ name: "total_employees", type: "int", nullable: true, default: 0 })
  totalEmployees: number;

  @Column({ name: "female_employees", type: "int", nullable: true, default: 0 })
  femaleEmployees: number;

  @Column({ name: "total_salary_fund", type: "bigint", nullable: true, default: 0 })
  totalSalaryFund: number;

  @Column({ name: "tnldSummary", type: "jsonb", nullable: true })
  tnldSummary: any;

  @Column({ name: "tnldTroCapSummary", type: "jsonb", nullable: true })
  tnldTroCapSummary: any;

  @Column({ name: "report_file_url", type: "varchar", length: 255, nullable: true })
  reportFileUrl: string;

  @Column({ name: "report_file_name", type: "varchar", length: 255, nullable: true })
  reportFileName: string;

  @Column({ name: "reject_reason", type: "text", nullable: true })
  rejectReason: string;

  @Column({ name: "created_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToMany(() => AccidentDetail, (detail) => detail.report, { cascade: true })
  accidentDetails: AccidentDetail[];
}
