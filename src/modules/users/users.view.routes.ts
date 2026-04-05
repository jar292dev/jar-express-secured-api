import { Router } from 'express';
import { container } from '../../container';
import { UsersViewController } from './users.view.controller';
import { UsersService } from './users.service';
import {
  authenticateWeb,
  authorizeWeb,
} from '../../shared/middlewares/authenticate-web.middleware';

const service = new UsersService(
  container.usersRepository,
  container.authRepository,
  container.auditRepository,
);
const controller = new UsersViewController(service);
const router = Router();

// Búsqueda en tiempo real (JSON)
router.get('/search', authenticateWeb, authorizeWeb('admin'), controller.search);

// Perfil propio — cualquier usuario autenticado
router.get('/me', authenticateWeb, controller.me);
router.post('/me', authenticateWeb, controller.updateMe);

// CRUD admin
router.get('/', authenticateWeb, authorizeWeb('admin'), controller.index);
router.get('/create', authenticateWeb, authorizeWeb('admin'), controller.create);
router.get('/:id', authenticateWeb, authorizeWeb('admin'), controller.show);
router.get('/:id/edit', authenticateWeb, authorizeWeb('admin'), controller.edit);
router.post('/', authenticateWeb, authorizeWeb('admin'), controller.store);
router.post('/:id', authenticateWeb, authorizeWeb('admin'), controller.update);
router.post('/:id/delete', authenticateWeb, authorizeWeb('admin'), controller.destroy);

export default router;
