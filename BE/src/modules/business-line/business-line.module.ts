import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessLineController, PublicBusinessLineController } from './business-line.controller';
import { BusinessLine } from './business-line.entity';
import { BusinessLineService } from './business-line.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessLine])],
  providers: [BusinessLineService],
  controllers: [BusinessLineController, PublicBusinessLineController],
})
export class BusinessLineModule {}