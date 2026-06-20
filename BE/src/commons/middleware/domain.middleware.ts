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
      // Skip lookup for admin domains and localhost dev
      const isAdminDomain = ["admin-dev.rcp.com.vn", "admin.rcp.com.vn", "localhost"].includes(domain);
      
      if (!isAdminDomain) {
        const manage = getManager();
        (req as any).doet = await manage.findOne(Doet, {
          where: { domain: domain }
        });
      } else {
        (req as any).doet = null;
      }
    } else {
      (req as any).doet = null;
    }
    next();
  }
}
