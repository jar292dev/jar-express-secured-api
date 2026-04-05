import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt.utils';
import { UnauthorizedError } from '../errors/app.error';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw new UnauthorizedError();

    const payload = jwtUtils.verifyAccessToken(token);
    req.context = {
      ...req.context,
      actorId: payload.sub,
      actorEmail: payload.email,
      actorRole: payload.role,
    };
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
