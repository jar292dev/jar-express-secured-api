import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { cookieUtils } from '../../shared/utils/cookie.utils';

export class AuthViewController {
  constructor(private authService: AuthService) {}

  showLogin = (req: Request, res: Response): void => {
    res.render('pages/auth/login', {
      title: 'Iniciar sesión',
      error: null,
      query: req.query,
      layout: 'layouts/auth',
    });
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken } = await this.authService.login(
        { email, password },
        req.context,
      );
      cookieUtils.setAccessToken(res, accessToken);
      cookieUtils.setRefreshToken(res, refreshToken);
      res.redirect('/dashboard');
    } catch (err: any) {
      res.render('pages/auth/login', {
        title: 'Iniciar sesión',
        error: err.message ?? 'Credenciales inválidas',
      });
    }
  };

  showRegister = (_req: Request, res: Response): void => {
    res.render('pages/auth/register', {
      title: 'Crear cuenta',
      error: null,
      layout: 'layouts/auth',
    });
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;
      await this.authService.register({ email, password, firstName, lastName });
      res.redirect('/auth/login?registered=1');
    } catch (err: any) {
      res.render('pages/auth/register', {
        title: 'Crear cuenta',
        error: err.message ?? 'Error al registrar el usuario',
        values: req.body,
      });
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) await this.authService.logout(refreshToken, req.context);
      cookieUtils.clearTokens(res);
      res.redirect('/auth/login');
    } catch (err) {
      next(err);
    }
  };
}
