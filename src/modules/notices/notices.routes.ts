import { Router } from 'express';
import { uuidSchema } from '../../shared/schemas/common.schema';
import { noticeCreateSchema, noticeFilterSchema } from './notices.schema';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/validate.middleware';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { container } from '../../shared/container';

const service = new NoticesService(container.noticesRepository);
const controller = new NoticesController(service);

const router = Router();

router.get('/', validateQuery(noticeFilterSchema), controller.findAllNotices);
router.get('/:id', validateParams(uuidSchema), controller.findNotice);
router.post('/', validateBody(noticeCreateSchema), controller.createNotice);
// router.put('/:id', validateParams(uuidSchema), controller.updateNotice);
// router.delete('/:id', validateParams(uuidSchema), controller.deleteNotice);

export default router;
