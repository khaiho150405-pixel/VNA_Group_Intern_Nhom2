import { Doet } from "../src/modules/doet/doet.entity";

declare module 'express' {
  export interface Request {
    doet?: Doet | null;
  }
}
