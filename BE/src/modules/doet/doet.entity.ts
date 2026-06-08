import { BaseAddressEntity, KeyValue } from "src/commons/bases/baseAddressEntity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("doets")
export class Doet extends BaseAddressEntity {
  constructor(doet: Partial<Doet>) {
    super(doet);
    const keys = [
      "id",
      "name",
      "name2",
      "parentId",
      "domain",
      "logo",
      "favicon",
      "province",
      "province2",
    ];
    doet &&
    keys.forEach((key) => {
      doet[key] !== undefined && (this[key] = doet[key]);
    });
  }

  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  name2: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  favicon: string;

  @Column({ type: 'jsonb', nullable: true })
  province2: KeyValue;
}
