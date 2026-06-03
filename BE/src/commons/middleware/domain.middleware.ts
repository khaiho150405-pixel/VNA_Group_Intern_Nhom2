import { NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response as R } from "express";
import { Doet } from "../../modules/doet/doet.entity";
import { getManager } from "typeorm";
import Response from "../response";
import { extractHostname } from "../helper/Domain";

export class DomainMiddleware implements NestMiddleware {
  async use(req: Request, res: R, next: NextFunction) {
    const fullDomain = req.get("origin") || req.get("host");
    if (fullDomain) {
      const domain = extractHostname(fullDomain);
      if (domain != "admin-dev.rcp.com.vn" || domain != "admin.rcp.com.vn") {
        const manage = getManager();
        req.doet = await manage.findOne(Doet, {
          where: {
            domain: domain
          }
        });
      }
    } else {
      throw Response.errorInternal("Cannot get domain");
    }
    next();
  }
}
