import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class password1635307538199 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    Logger.debug('Run migration: password1635307538199');
    await queryRunner.query(`
      update users set password = '$argon2i$v=19$m=4096,t=3,p=1$xiJm548C+55eJ+dYWS7hvg$dNROGSIeRq0L1Wm09WrCKudz9S2JJX06uKWVj1XJ2t4'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
