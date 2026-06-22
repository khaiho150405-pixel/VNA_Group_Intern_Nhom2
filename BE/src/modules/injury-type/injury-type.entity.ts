import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("injury_types")
export class InjuryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, unique: true, nullable: false })
  code: string;

  @Column({ type: "varchar", length: 500, nullable: false })
  name: string;

  @Column({ type: "int", default: 1 })
  level: number;

  @Column({ type: "boolean", default: true })
  status: boolean;

  @Column({ name: "created_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
