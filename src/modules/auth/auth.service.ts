import { User } from '../../generated/prisma';
import { UnauthorizedError, ConflictError, ForbiddenError } from '../../shared/errors/app.error';
import { RequestContext } from '../../shared/types/request-context';
import { jwtUtils } from '../../shared/utils/jwt.utils';
import { passwordUtils } from '../../shared/utils/password.utils';
import { UserLoginAuditRepository } from '../users/user-login-audit.repository';
import { AuthRepository } from './auth.repository';
import { LoginDTO, RegisterDTO } from './auth.schema';
import { v7 as uuidv7 } from 'uuid';
import crypto from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private loginAuditRepository: UserLoginAuditRepository,
  ) {}

  async register(data: RegisterDTO): Promise<User> {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) throw new ConflictError('User', 'email');

    const passwordHash = await passwordUtils.hash(data.password);
    return this.authRepository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  }

  async login(
    data: LoginDTO,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(data.email);

    // Usuario no existe
    if (!user) {
      await this.loginAuditRepository.log({
        email: data.email,
        action: 'LOGIN_FAILED',
        success: false,
        failureReason: 'USER_NOT_FOUND',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Cuenta bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.loginAuditRepository.log({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        success: false,
        failureReason: 'ACCOUNT_LOCKED',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new ForbiddenError('Cuenta bloqueada temporalmente');
    }

    // Cuenta inactiva
    if (!user.isActive) {
      throw new ForbiddenError('Cuenta desactivada');
    }

    // Contraseña incorrecta
    const isValid = await passwordUtils.verify(user.passwordHash, data.password);
    if (!isValid) {
      await this.authRepository.incrementFailedLogins(user.id);

      if (user.failedLoginAttempts + 1 >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await this.authRepository.lockUser(user.id, lockedUntil);
        await this.loginAuditRepository.log({
          userId: user.id,
          email: user.email,
          action: 'ACCOUNT_LOCKED',
          success: false,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
        throw new ForbiddenError(
          `Cuenta bloqueada ${LOCK_DURATION_MINUTES} minutos por exceso de intentos`,
        );
      }

      await this.loginAuditRepository.log({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        success: false,
        failureReason: 'INVALID_PASSWORD',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Login correcto
    await this.authRepository.resetFailedLogins(user.id);

    const accessToken = jwtUtils.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: refreshToken, jti } = jwtUtils.signRefreshToken(user.id);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    await this.loginAuditRepository.log({
      userId: user.id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    refreshToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = jwtUtils.verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const stored = await this.authRepository.findRefreshToken(tokenHash);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Usuario no válido');

    // Rotar refresh token
    await this.authRepository.revokeRefreshToken(stored.id);

    const accessToken = jwtUtils.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { token: newRefreshToken } = jwtUtils.signRefreshToken(user.id);
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await this.authRepository.saveRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string, context: RequestContext): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.authRepository.findRefreshToken(tokenHash);

    if (stored) {
      await this.authRepository.revokeRefreshToken(stored.id);
      await this.loginAuditRepository.log({
        userId: stored.userId,
        email: '',
        action: 'LOGOUT',
        success: true,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }
  }
}
