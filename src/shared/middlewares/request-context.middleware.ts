import { Request, Response, NextFunction } from 'express';

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.context = {
    actorId: null,
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip,
    userAgent: req.headers['user-agent'],
  };
  next();
}
