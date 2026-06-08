import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class doet1635390919190 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let queries = fs
      .readFileSync(join(__dirname, '../sql/doets.sql'))
      .toString();
    await queryRunner.query(queries);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            delete from doets;
        `);
  }
}
