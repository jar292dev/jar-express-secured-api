import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../../shared/constants/http.constants';
import { cookieUtils } from '../../shared/utils/cookie.utils';
import { AuthService } from './auth.service';
import { LoginDTO, RegisterDTO } from './auth.schema';
import { UnauthorizedError } from '../../shared/errors/app.error';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.validatedBody as RegisterDTO;
      await this.authService.register(dto);
      res
        .status(HTTP_STATUS.CREATED)
        .json({ data: { message: 'Usuario registrado correctamente' } });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.validatedBody as LoginDTO;
      const { accessToken, refreshToken } = await this.authService.login(dto, req.context);
      cookieUtils.setAccessToken(res, accessToken);
      cookieUtils.setRefreshToken(res, refreshToken);
      res.status(HTTP_STATUS.OK).json({ data: { message: 'Login correcto' } });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) throw new UnauthorizedError('Refresh token no encontrado');

      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refresh(
        refreshToken,
        req.context,
      );

      cookieUtils.setAccessToken(res, accessToken);
      cookieUtils.setRefreshToken(res, newRefreshToken);
      res.status(HTTP_STATUS.OK).json({ data: { message: 'Token renovado' } });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) await this.authService.logout(refreshToken, req.context);
      cookieUtils.clearTokens(res);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}
