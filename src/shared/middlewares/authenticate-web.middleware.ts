import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt.utils';

export function authenticateWeb(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.redirect('/auth/login');
      return;
    }

    const payload = jwtUtils.verifyAccessToken(token);
    req.context = {
      ...req.context,
      actorId: payload.sub,
      actorEmail: payload.email,
      actorRole: payload.role,
    };
    next();
  } catch {
    res.redirect('/auth/login');
  }
}

export function authorizeWeb(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.context?.actorRole;
    if (!role || !roles.includes(role)) {
      res.status(403).render('errors/403', {
        title: 'Acceso denegado',
        message: 'No tienes permisos para acceder a esta página',
      });
      return;
    }
    next();
  };
}
