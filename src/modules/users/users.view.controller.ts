import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UsersService } from './users.service';

export class UsersViewController {
  constructor(private usersService: UsersService) {}

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.usersService.findMe(req.context);
      res.render('pages/users/me', { title: 'Mi perfil', user });
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, locale } = req.body;
      await this.usersService.updateMe(req.context, { firstName, lastName, locale });
      res.redirect('/me?updated=1');
    } catch (err: any) {
      const user = await this.usersService.findMe(req.context).catch(() => null);
      res.render('pages/users/me', {
        title: 'Mi perfil',
        user,
        error: err.message ?? 'Error al actualizar el perfil',
      });
    }
  };

  index: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const { page, pageSize, orderBy, orderDirection, ...filters } = req.query as any;
      const result = await this.usersService.findAll(filters, {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 20,
        orderBy: orderBy ?? 'createdAt',
        orderDirection: orderDirection ?? 'desc',
      });
      res.render('pages/users/index', {
        title: 'Usuarios',
        users: result.data,
        meta: result.meta,
        filters: req.query,
      });
    } catch (err) {
      next(err);
    }
  };

  show: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const user = await this.usersService.findById(String(req.params.id));
      res.render('pages/users/show', { title: `${user.email}`, user });
    } catch (err) {
      next(err);
    }
  };

  create: RequestHandler = async (_req, res, next): Promise<void> => {
    try {
      res.render('pages/users/form', { title: 'Nuevo usuario', user: null, error: null });
    } catch (err) {
      next(err);
    }
  };

  store: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role, isActive } = req.body;
      await this.usersService.create(
        {
          email,
          password,
          firstName,
          lastName,
          role: role ?? 'user',
          isActive: isActive === 'true',
        },
        req.context,
      );
      res.redirect('/users');
    } catch (err: any) {
      res.render('pages/users/form', {
        title: 'Nuevo usuario',
        user: null,
        error: err.message ?? 'Error al crear el usuario',
        values: req.body,
      });
    }
  };

  edit: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const user = await this.usersService.findById(String(req.params.id));
      res.render('pages/users/form', { title: 'Editar usuario', user, error: null });
    } catch (err) {
      next(err);
    }
  };

  update: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { firstName, lastName, role, isActive } = req.body;
      await this.usersService.update(
        id,
        {
          firstName,
          lastName,
          role,
          isActive: isActive === 'true',
        },
        req.context,
      );
      res.redirect(`/users/${id}`);
    } catch (err: any) {
      const user = await this.usersService.findById(String(req.params.id)).catch(() => null);
      res.render('pages/users/form', {
        title: 'Editar usuario',
        user,
        error: err.message ?? 'Error al actualizar el usuario',
      });
    }
  };

  destroy: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      await this.usersService.delete(String(req.params.id), req.context);
      res.redirect('/users');
    } catch (err) {
      next(err);
    }
  };

  // Endpoint JSON para búsqueda en tiempo real
  search: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const { q, role } = req.query as any;
      const result = await this.usersService.findAll({ email: q, role }, { page: 1, pageSize: 10 });
      res.json({ data: result.data });
    } catch (err) {
      next(err);
    }
  };
}
