import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class permissions1635390919192 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let queries = fs
      .readFileSync(join(__dirname, '../sql/permissions.sql'))
      .toString();
    await queryRunner.query(queries);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS role_permissions;
      DROP TABLE IF EXISTS permissions;
    `);
  }
}
