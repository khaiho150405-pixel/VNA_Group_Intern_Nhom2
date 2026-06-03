import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/commons/bases/baseService';
import Response, { ResponseData, List } from 'src/commons/response';
import { EntityManager, getManager, Repository } from 'typeorm';
import { View } from './view.entity';

@Injectable()
export class ViewService extends BaseService<View> {
  manager: EntityManager;
  constructor(
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
  ) {
    super(viewRepository, (data) => new View(data));
    this.manager = getManager();
  }

  async getViewsByRoleId(roleId: number): Promise<ResponseData<List<View[]>>> {
    try {
      const data = await this.manager.query(`
        select * from views v, jsonb_array_elements(v.activities) a
        where a->>'roleId' = ${roleId}::text and "deletedAt" is null
      `);
      const items = data.map((x) => {
        const activities = x.activities.filter((y) => y.roleId === roleId);
        return {
          ...x,
          activities,
        };
      });
      const list: List<View[]> = {
        items,
        count: items.length,
      };
      return Response.getList<View>(list);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
