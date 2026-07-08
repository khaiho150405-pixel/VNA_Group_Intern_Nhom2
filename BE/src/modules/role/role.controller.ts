import { Controller, UseGuards, Get, Query, Request, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController, ResponseInterceptor, GetAllDto } from 'src/commons';
import { AuthGuard } from 'src/commons/guards/authGuard';
import { Role } from './role.entity';
import { RoleService } from './role.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(AuthGuard)
@UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
export class RoleController extends BaseController<Role, RoleService> {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  async get(@Query() getAllDto: GetAllDto, @Request() req) {
    await this.roleService.checkReadPermission(req.user);
    return await super.get(getAllDto, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết vai trò' })
  async getDetail(
    @Query() getAllDto: GetAllDto,
    @Param('id') id: string,
    @Request() req
  ) {
    await this.roleService.checkReadPermission(req.user);
    return await super.getDetail(getAllDto, id, req);
  }
}

