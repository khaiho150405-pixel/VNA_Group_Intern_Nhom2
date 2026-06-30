import { Controller, Get, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor } from "src/commons";
import { AuthGuard } from "src/commons/guards/authGuard";
import { Occupation } from "./occupation.entity";
import { OccupationService } from "./occupation.service";
import Response from "../../commons/response";

@ApiTags("Occupation")
@Controller("occupation")
@UseGuards(AuthGuard)
export class OccupationController extends BaseController<Occupation, OccupationService> {
  constructor(private readonly occupationService: OccupationService) {
    super(occupationService);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách nghề nghiệp đang hoạt động (dropdown)" })
  async getActiveDropdown() {
    const data = await this.occupationService.getActiveForDropdown();
    return Response.get(data);
  }

  @Get("list")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách nghề nghiệp (phân trang, tìm kiếm)" })
  async findAll(
    @Query("manghe") manghe?: string,
    @Query("tennghe") tennghe?: string,
    @Query("cap") cap?: string,
    @Query("trangthai") trangthai?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return await this.occupationService.findAll({
      manghe, tennghe, cap, trangthai,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }
}
