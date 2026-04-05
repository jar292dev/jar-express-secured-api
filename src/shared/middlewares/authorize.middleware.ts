import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app.error';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.context?.actorRole;
    if (!role || !roles.includes(role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
