import { IsPhoneNumber } from 'class-validator';
import { Column } from 'typeorm';
import { BaseEntity } from '.';

export class KeyValue {
  key: any;

  value: string;

  constructor(keyValue: Partial<KeyValue>) {
    Object.assign(this, keyValue);
  }
}

export abstract class BaseAddressEntity extends BaseEntity {
  constructor(baseEntity: Partial<BaseEntity>) {
    super(baseEntity);
    const keys = [
      'phone',
      'address',
      'ward',
      'quarter',
      'district',
      'province',
    ];
    baseEntity &&
      keys.forEach((key) => {
        baseEntity[key] !== undefined && (this[key] = baseEntity[key]);
      });
  }

  @Column({ nullable: true })
  @IsPhoneNumber('VN')
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  quarter: string;

  @Column({ type: 'jsonb', nullable: true })
  ward: KeyValue;

  @Column({ type: 'jsonb', nullable: true })
  district: KeyValue;

  @Column({ type: 'jsonb', nullable: true })
  province: KeyValue;
}
