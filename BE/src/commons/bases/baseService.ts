import { Injectable } from "@nestjs/common";
import {
  Between,
  DeleteResult,
  ILike,
  In,
  Not,
  Repository,
  UpdateResult
} from "typeorm";
import Response, { ResponseData, List } from "../response";

import { GetAllDto } from "./baseDto";
import { Doet } from "../../modules/doet/doet.entity";
import * as argon from "argon2";

const ignoreDoet = [
  "ethnic",
  "years",
  "doets",
  "profiles",
  "preferentials",
  "views",
  "categories",
  "roles",
  "infoBeneficiaries",
  "users"
];

@Injectable()
export class BaseService<T> {
  private readonly baseRepository: Repository<T>;
  private readonly newEntity: Function;

  constructor(baseRepository: Repository<T>, newEntity: Function) {
    this.baseRepository = baseRepository;
    this.newEntity = newEntity;
  }

  async get(getAllDto: GetAllDto, doet: Doet | null = null): Promise<ResponseData<List<T[]>>> {
    try {
      let { pageSize, pageNumber, order } = getAllDto;
      const select = (getAllDto.select && JSON.parse(getAllDto.select)) || null;
      const relations =
        (getAllDto.relation && JSON.parse(getAllDto.relation)) || null;
      const where = (getAllDto.where && JSON.parse(getAllDto.where)) || {};
      if (where instanceof Array) {
        for (const item of where) {
          Object.keys(item).forEach((key) => {
            if (item[key].operation === "like") {
              item[key] = ILike(item[key].value);
            } else if (item[key].operation === "in") {
              item[key] = In(item[key].value);
            } else if (item[key].operation === "notIn") {
              item[key] = Not(In(item[key].value));
            } else if (item[key].operation === "=") {
              item[key] = item[key].value;
            } else if (item[key].operation === "between") {
              item[key] = Between(item[key].value[0], item[key].value[1]);
            }
          });
        }
      } else {
        Object.keys(where).forEach((key) => {
          if (where[key]?.operation === "like") {
            where[key] = ILike(where[key].value);
          } else if (where[key]?.operation === "in") {
            where[key] = In(where[key].value);
          } else if (where[key]?.operation === "notIn") {
            where[key] = Not(In(where[key].value));
          } else if (where[key]?.operation === "=") {
            where[key] = where[key].value;
          } else if (where[key]?.operation === "between") {
            where[key] = Between(where[key].value[0], where[key].value[1]);
          }
        });
      }
      if (doet && doet.id && !ignoreDoet.includes(this.baseRepository.metadata.tableName) && !where.doet_id) {
        where.doet_id = doet.id;
      }
      let [items, count] = await this.baseRepository.findAndCount({
        where,
        relations,
        select,
        order: { ...JSON.parse(order || "{}") },
        skip: pageSize * pageNumber,
        take: pageSize
      });

      const list: List<T[]> = {
        items,
        count,
        pageSize: +pageSize,
        pageNumber: +pageNumber
      };
      return Response.getList<T>(list);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async getDetail(getAllDto: GetAllDto, id: string, doet: Doet | null): Promise<ResponseData<T>> {
    try {
      const relations =
        (getAllDto.relation && JSON.parse(getAllDto.relation)) || null;
      const _where: {
        id: any,
        doet_id?: any
      } = {
        id: id
      };
      if (doet && doet.id && !ignoreDoet.includes(this.baseRepository.metadata.tableName)) {
        _where.doet_id = doet.id;
      }
      const product = await this.baseRepository.findOne({
        where: _where,
        relations
      });
      if (!product) {
        throw Response.errorNotFound(Response.NOT_FOUND("Item"));
      }
      return Response.get<T>(product);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async post(currentUser: any, itemDto: any, doet: Doet): Promise<ResponseData<T>> {
    try {
      if (itemDto.password) {
        itemDto.password = await argon.hash(itemDto.password);
      }
      const _entity: any = {
        ...itemDto,
        createdAt: new Date(),
        createdBy: currentUser.id
      };
      if (doet && doet.id && !ignoreDoet.includes(this.baseRepository.metadata.tableName)) {
        _entity.doet_id = doet.id;
      }
      const item = await this.baseRepository.save(
        this.newEntity(_entity)
      );

      return Response.get<T>(item);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async put(
    currentUser: any,
    id: string,
    itemDto: any
  ): Promise<ResponseData<UpdateResult>> {
    try {
      if (itemDto.password) {
        itemDto.password = await argon.hash(itemDto.password);
      }
      const result = await this.baseRepository.update(
        id,
        this.newEntity({
          ...itemDto,
          updatedAt: new Date(),
          updatedBy: currentUser.id
        })
      );

      return Response.get<UpdateResult>(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async putRelations(
    currentUser: any,
    id: string,
    itemDto: T
  ): Promise<ResponseData<T>> {
    try {
      const item = await this.baseRepository.findOne(id);
      Object.keys(itemDto).forEach((x) => {
        item[x] = [...itemDto[x]];
      });
      const result = await this.baseRepository.save({
        ...item,
        updatedAt: new Date(),
        updatedBy: currentUser.id
      });

      return Response.get(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async delete(
    currentUser: any,
    id: string
  ): Promise<ResponseData<UpdateResult>> {
    try {
      const result = await this.baseRepository.update(
        id,
        this.newEntity({
          deletedAt: new Date(),
          deletedBy: currentUser.id
        })
      );
      return Response.get<UpdateResult>(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async destroy(id: string): Promise<ResponseData<DeleteResult>> {
    try {
      const result = await this.baseRepository.delete(id);

      return Response.get<DeleteResult>(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async deletes(
    currentUser,
    ids: string[],
    doet: Doet | null
  ): Promise<ResponseData<UpdateResult>> {
    try {
      const result = await this.baseRepository.update(
        ids,
        this.newEntity({
          deletedAt: new Date(),
          deletedBy: currentUser.id
        })
      );
      return Response.get<UpdateResult>(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }

  async destroys(
    currentUser: any,
    ids: string[],
    doet: Doet | null
  ): Promise<ResponseData<DeleteResult>> {
    try {
      const result = await this.baseRepository.delete(ids);

      return Response.get<DeleteResult>(result);
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
