import { Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { BusinessLine } from "./business-line.entity";
import { BusinessLineService } from "./business-line.service";
import Response from "../../commons/response";

@ApiTags("Business Line")
@Controller("business-line")
@UseGuards(AuthGuard)
export class BusinessLineController extends BaseController<BusinessLine, BusinessLineService> {
  constructor(private readonly businessLineService: BusinessLineService) {
    super(businessLineService);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách ngành nghề kinh doanh cấp 4 đang hoạt động" })
  async getActiveLevel4Dropdown() {
    const data = await this.businessLineService.getActiveLevel4ForDropdown();
    return Response.get(data);
  }
}