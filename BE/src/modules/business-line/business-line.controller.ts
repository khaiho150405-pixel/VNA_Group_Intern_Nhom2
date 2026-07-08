import { Controller, Get, Query, UseGuards, UseInterceptors, ClassSerializerInterceptor, Request, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { BaseController, ResponseInterceptor, GetAllDto } from "src/commons";
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

  @Get("list")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách ngành nghề kinh doanh (phân trang, tìm kiếm)" })
  async findAll(
    @Query("manganh") manganh?: string,
    @Query("tennganh") tennganh?: string,
    @Query("cap") cap?: string,
    @Query("trangthai") trangthai?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Request() req?: any,
  ) {
    return await this.businessLineService.findAll({
      manganh, tennganh, cap, trangthai,
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    }, req?.user);
  }

  @Get("dropdown/active")
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: "Lấy danh sách ngành nghề kinh doanh cấp 4 đang hoạt động" })
  async getActiveLevel4Dropdown() {
    const data = await this.businessLineService.getActiveLevel4ForDropdown();
    return Response.get(data);
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy danh sách ngành nghề kinh doanh' })
  async get(@Query() getAllDto: GetAllDto, @Request() req) {
    await this.businessLineService.checkReadPermission(req.user);
    return await super.get(getAllDto, req);
  }

  @Get(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Lấy chi tiết ngành nghề kinh doanh' })
  async getDetail(
    @Query() getAllDto: GetAllDto,
    @Param('id') id: string,
    @Request() req
  ) {
    await this.businessLineService.checkReadPermission(req.user);
    return await super.getDetail(getAllDto, id, req);
  }
}

@ApiTags("Public Business Line")
@Controller("public/business-line")
export class PublicBusinessLineController {
  constructor(private readonly businessLineService: BusinessLineService) {}

  @Get("dropdown/active")
  async getActiveLevel4Dropdown() {
    return await this.businessLineService.getActiveLevel4ForDropdown();
  }
}