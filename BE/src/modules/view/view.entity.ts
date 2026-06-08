import { BaseEntity } from 'src/commons';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './view.model';

@Entity('views')
export class View extends BaseEntity {
  constructor(
    view?: Partial<View>,
    keys: string[] = [
      'id',
      'name',
      'activities',
      'url',
      'icon',
      'parentId',
      'order',
      'doet_id'
    ],
  ) {
    super(view);
    view &&
      keys.forEach((key) => {
        view[key] !== undefined && (this[key] = view[key]);
      });
  }
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  activities: Activity[];

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  doet_id: number;

  @Column({ nullable: true })
  order: number;
}
