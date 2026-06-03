import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "src/commons";
import { EntityManager, getManager, Repository } from "typeorm";
import { Doet } from "./doet.entity";
import Response from "../../commons/response";
import { KeyValue } from "../../commons/bases/baseAddressEntity";

@Injectable()
export class DoetService extends BaseService<Doet> {
  manager: EntityManager;
  constructor(
    @InjectRepository(Doet)
    private readonly doetRepository: Repository<Doet>,
  ) {
    super(doetRepository, (data) => new Doet(data));
    this.manager = getManager();
  }

  async getSetting(doet: Doet) {
    if (doet && doet.id) {
      return {
        name: doet.name2,
        province: doet.province2,
        logo: doet.logo ? { url: doet.logo } : null,
        favicon: doet.favicon ? { url: doet.favicon } : null
      };
    }
    throw Response.errorNotFound(Response.NOT_FOUND("doet_id"));
  }

  async updateSetting(doet: Doet, name, logo, favicon, province) {
    try {
      if (doet && doet.id) {
        const data: {
          name2: string,
          province2: KeyValue,
          logo?: string,
          favicon?: string,
        } = {
          name2: name,
          province2: province,
        };
        if (logo) {
          data.logo = logo;
        }
        if (favicon) {
          data.favicon = favicon;
        }
        await this.doetRepository.update({
          id: doet.id
        }, data);
        return Response.SUCCESSFULLY;
      }
      throw Response.errorNotFound(Response.NOT_FOUND("doet_id"));
    } catch (error) {
      throw Response.errorInternal(error);
    }
  }
}
