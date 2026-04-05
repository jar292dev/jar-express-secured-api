import { Request, Response, NextFunction } from 'express';
import { NoticesService } from './modules/notices/notices.service';
import { UsersService } from './modules/users/users.service';

export class DashboardViewController {
  constructor(
    private noticesService: NoticesService,
    private usersService: UsersService,
  ) {}

  index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [notices, users] = await Promise.all([
        this.noticesService.findAll({}, { page: 1, pageSize: 5 }),
        this.usersService.findAll({}, { page: 1, pageSize: 5 }),
      ]);

      res.render('pages/dashboard/index', {
        title: 'Dashboard',
        notices: notices.data,
        noticesTotal: notices.meta.total,
        users: users.data,
        usersTotal: users.meta.total,
        actorRole: req.context.actorRole,
      });
    } catch (err) {
      next(err);
    }
  };
}
