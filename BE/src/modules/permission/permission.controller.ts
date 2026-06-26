import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/commons';
import { AuthGuard } from 'src/commons/guards/authGuard';
import { Permission } from './permission.entity';
import { PermissionService } from './permission.service';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionController extends BaseController<Permission, PermissionService> {
  constructor(private readonly permissionService: PermissionService) {
    super(permissionService);
  }
}
