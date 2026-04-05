import { Router } from 'express';
import { container } from '../../container';
import { NoticesViewController } from './notices.view.controller';
import { authenticateWeb } from '../../shared/middlewares/authenticate-web.middleware';

const controller = new NoticesViewController(container.noticesService);

const router = Router();

router.get('/', authenticateWeb, controller.index);
router.get('/create', authenticateWeb, controller.create);
router.get('/:id', authenticateWeb, controller.show);
router.get('/:id/edit', authenticateWeb, controller.edit);
router.post('/', authenticateWeb, controller.store);
router.post('/:id', authenticateWeb, controller.update);
router.post('/:id/delete', authenticateWeb, controller.destroy);

export default router;
