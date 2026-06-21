import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjuryFactor } from "./injury-factor.entity";
import { InjuryFactorService } from "./injury-factor.service";
import { InjuryFactorController } from "./injury-factor.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([InjuryFactor]),
    AuthModule,
  ],
  controllers: [InjuryFactorController],
  providers: [InjuryFactorService],
  exports: [InjuryFactorService],
})
export class InjuryFactorModule {}
