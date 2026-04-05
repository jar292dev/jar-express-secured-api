import { Router } from 'express';
import { validateBody } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/authenticate.middleware';
import { loginSchema, registerSchema } from './auth.schema';
import { AuthController } from './auth.controller';
import { container } from '../../container';

const controller = new AuthController(container.authService);
const router = Router();

router.post('/register', validateBody(registerSchema), controller.register);
router.post('/login', validateBody(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export default router;
