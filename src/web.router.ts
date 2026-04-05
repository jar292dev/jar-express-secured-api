import { Router } from 'express';
import authViewRouter from './modules/auth/auth.view.routes';
import noticesViewRouter from './modules/notices/notices.view.routes';
import usersViewRouter from './modules/users/users.view.routes';
import { DashboardViewController } from './dashboard.view.controller';
import { authenticateWeb } from './shared/middlewares/authenticate-web.middleware';
import { container } from './container';
import { UsersService } from './modules/users/users.service';

const dashboardController = new DashboardViewController(
  container.noticesService,
  new UsersService(container.usersRepository, container.authRepository, container.auditRepository),
);

const router = Router();

router.get('/', (_, res) => res.redirect('/dashboard'));
router.use('/auth', authViewRouter);
router.get('/dashboard', authenticateWeb, dashboardController.index);
router.use('/notices', noticesViewRouter);
router.use('/users', usersViewRouter);
router.use('/me', usersViewRouter);

export default router;
