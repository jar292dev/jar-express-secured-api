import { Router } from 'express';
import { container } from '../../container';
import { AuthViewController } from './auth.view.controller';
import { authenticateWeb } from '../../shared/middlewares/authenticate-web.middleware';

const controller = new AuthViewController(container.authService);
const router = Router();

router.get('/login', controller.showLogin);
router.post('/login', controller.login);
router.get('/register', controller.showRegister);
router.post('/register', controller.register);
router.post('/logout', authenticateWeb, controller.logout);

export default router;
