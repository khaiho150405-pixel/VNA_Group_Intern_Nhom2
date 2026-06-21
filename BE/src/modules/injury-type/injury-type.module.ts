import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjuryType } from "./injury-type.entity";
import { InjuryTypeService } from "./injury-type.service";
import { InjuryTypeController } from "./injury-type.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([InjuryType]),
    AuthModule,
  ],
  controllers: [InjuryTypeController],
  providers: [InjuryTypeService],
  exports: [InjuryTypeService],
})
export class InjuryTypeModule {}
