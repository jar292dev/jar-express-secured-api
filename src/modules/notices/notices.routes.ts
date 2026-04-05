import { Router } from 'express';
import { uuidSchema } from '../../shared/schemas/common.schema';
import { noticeCreateSchema, noticeFilterSchema, noticeUpdateSchema } from './notices.schema';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validate.middleware';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { container } from '../../container';
import { authenticate } from '../../shared/middlewares/authenticate.middleware';
import { authorize } from '../../shared/middlewares/authorize.middleware';

const service = new NoticesService(container.noticesRepository, container.auditRepository);
const controller = new NoticesController(service);

const router = Router();

router.get('/', authenticate, validateQuery(noticeFilterSchema), controller.findAllNotices);
router.get('/:id', authenticate, validateParams(uuidSchema), controller.findNotice);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateBody(noticeCreateSchema),
  controller.createNotice,
);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateBody(noticeUpdateSchema),
  controller.updateNotice,
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateParams(uuidSchema),
  controller.deleteNotice,
);

export default router;
