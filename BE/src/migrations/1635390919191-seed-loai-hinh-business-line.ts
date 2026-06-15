import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import { join } from 'path';

export class seedLoaiHinhBusinessLine1635390919191 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query('DELETE FROM loai_hinh_kinh_doanh;');
      await queryRunner.query('DELETE FROM business_line;');
    } catch (err) {
      console.warn('Could not clear tables before seeding:', err.message);
    }

    let loaiHinhQueries = fs
      .readFileSync(join(__dirname, '../sql/loai-hinh-kinh-doanh.sql'))
      .toString();
    await queryRunner.query(loaiHinhQueries);

    let businessLineQueries = fs
      .readFileSync(join(__dirname, '../sql/business-line.sql'))
      .toString();
    await queryRunner.query(businessLineQueries);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM loai_hinh_kinh_doanh;
      DELETE FROM business_line;
    `);
  }
}
