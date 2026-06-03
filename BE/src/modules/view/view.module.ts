import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViewController } from './view.controller';
import { View } from './view.entity';
import { ViewService } from './view.service';

@Module({
  imports: [TypeOrmModule.forFeature([View])],
  providers: [ViewService],
  controllers: [ViewController],
  exports: [ViewService],
})
export class ViewModule {}
