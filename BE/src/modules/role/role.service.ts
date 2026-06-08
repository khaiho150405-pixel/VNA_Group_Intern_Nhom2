import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/commons';
import { EntityManager, getManager, In, Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService extends BaseService<Role> {
  manager: EntityManager;
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(roleRepository, (data) => new Role(data));
    this.manager = getManager();
  }
}
