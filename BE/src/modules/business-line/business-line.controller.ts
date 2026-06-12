import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BaseController } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { BusinessLine } from "./business-line.entity";
import { BusinessLineService } from "./business-line.service";

@ApiTags("Business Line")
@Controller("business-line")
@UseGuards(AuthGuard)
export class BusinessLineController extends BaseController<BusinessLine, BusinessLineService> {
  constructor(private readonly businessLineService: BusinessLineService) {
    super(businessLineService);
  }

  @Get("dropdown/active")
  async getActiveLevel4Dropdown() {
    return await this.businessLineService.getActiveLevel4ForDropdown();
  }
}