import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/commons';
import { AuthGuard } from 'src/commons/guards/authGuard';
import { Role } from './role.entity';
import { RoleService } from './role.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(AuthGuard)
export class RoleController extends BaseController<Role, RoleService> {
  constructor(private readonly roleService: RoleService) {
    super(roleService);
  }
}
