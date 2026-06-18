import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoaiHinhKinhDoanhController, PublicLoaiHinhKinhDoanhController } from './loai-hinh-kinh-doanh.controller';
import { LoaiHinhKinhDoanh } from './loai-hinh-kinh-doanh.entity';
import { LoaiHinhKinhDoanhService } from './loai-hinh-kinh-doanh.service';

@Module({
  imports: [TypeOrmModule.forFeature([LoaiHinhKinhDoanh])],
  providers: [LoaiHinhKinhDoanhService],
  controllers: [LoaiHinhKinhDoanhController, PublicLoaiHinhKinhDoanhController],
})
export class LoaiHinhKinhDoanhModule {}
