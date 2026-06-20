import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoetController, PublicDoetController } from './doet.controller';
import { Doet } from './doet.entity';
import { DoetService } from './doet.service';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doet, User])],
  providers: [DoetService],
  controllers: [DoetController, PublicDoetController],
  exports: [DoetService],
})
export class DoetModule {}

