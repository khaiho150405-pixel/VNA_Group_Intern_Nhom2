import { Controller, Get, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor, Request, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor, GetAllDto } from "src/commons";
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
    @Request() req?: any,
  ) {
    return await this.occupationService.findAll({
      manghe, tennghe, cap, trangthai,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, req?.user);
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy danh sách nghề nghiệp' })
  async get(@Query() getAllDto: GetAllDto, @Request() req) {
    await this.occupationService.checkReadPermission(req.user);
    return await super.get(getAllDto, req);
  }

  @Get(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy chi tiết nghề nghiệp' })
  async getDetail(
    @Query() getAllDto: GetAllDto,
    @Param('id') id: string,
    @Request() req
  ) {
    await this.occupationService.checkReadPermission(req.user);
    return await super.getDetail(getAllDto, id, req);
  }
}
