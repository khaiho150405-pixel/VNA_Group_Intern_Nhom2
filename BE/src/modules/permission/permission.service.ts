import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/commons';
import { EntityManager, getManager, Repository } from 'typeorm';
import { Permission } from './permission.entity';

@Injectable()
export class PermissionService extends BaseService<Permission> {
  manager: EntityManager;
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {
    super(permissionRepository, (data) => new Permission(data));
    this.manager = getManager();
  }
}
