import { Doet } from '../../modules/doet/doet.entity';

declare global {
  namespace Express {
    interface Request {
      doet?: Doet;
    }
  }
}