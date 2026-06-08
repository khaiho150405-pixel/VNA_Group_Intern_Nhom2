import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class user1635231873864 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let queries = fs
      .readFileSync(join(__dirname, '../sql/user.sql'))
      .toString();
    await queryRunner.query(queries);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            delete from users;
        `);
  }
}
