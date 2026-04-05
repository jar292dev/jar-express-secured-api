import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authenticate.middleware';
import { authorize } from '../../shared/middlewares/authorize.middleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validate.middleware';
import { uuidSchema } from '../../shared/schemas/common.schema';
import { container } from '../../container';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  userCreateSchema,
  userFilterSchema,
  userUpdateMeSchema,
  userUpdateSchema,
} from './users.schema';

const service = new UsersService(
  container.usersRepository,
  container.authRepository,
  container.auditRepository,
);
const controller = new UsersController(service);

const router = Router();

// Perfil propio — cualquier usuario autenticado
router.get('/me', authenticate, controller.getMe);
router.put('/me', authenticate, validateBody(userUpdateMeSchema), controller.updateMe);

// CRUD admin — solo admins
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateQuery(userFilterSchema),
  controller.findAll,
);
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validateParams(uuidSchema),
  controller.findById,
);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateBody(userCreateSchema),
  controller.create,
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateParams(uuidSchema),
  validateBody(userUpdateSchema),
  controller.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateParams(uuidSchema),
  controller.delete,
);

export default router;
