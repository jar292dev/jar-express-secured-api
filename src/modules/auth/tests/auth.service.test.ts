import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../../../shared/errors/app.error';
import * as passwordUtils from '../../../shared/utils/password.utils';
import * as jwtUtils from '../../../shared/utils/jwt.utils';

const mockAuthRepository = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  saveRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllUserRefreshTokens: vi.fn(),
  incrementFailedLogins: vi.fn(),
  resetFailedLogins: vi.fn(),
  lockUser: vi.fn(),
};

const mockLoginAuditRepository = {
  log: vi.fn(),
};

const service = new AuthService(mockAuthRepository as any, mockLoginAuditRepository as any);

const mockContext = {
  actorId: null,
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
};

const mockUser = {
  id: '019d5d54-e733-743c-b40f-d681d11a56f8',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  role: 'user',
  isActive: true,
  isEmailVerified: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
};

beforeEach(() => vi.clearAllMocks());

describe('AuthService', () => {
  describe('register', () => {
    it('registra un usuario nuevo correctamente', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
      expect(mockAuthRepository.createUser).toHaveBeenCalledOnce();
    });

    it('lanza ConflictError si el email ya existe', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictError);

      expect(mockAuthRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('lanza UnauthorizedError si el usuario no existe', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@example.com', password: '123' }, mockContext),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED', failureReason: 'USER_NOT_FOUND' }),
      );
    });

    it('lanza ForbiddenError si la cuenta está bloqueada', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(
        service.login({ email: 'test@example.com', password: '123' }, mockContext),
      ).rejects.toThrow(ForbiddenError);

      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED', failureReason: 'ACCOUNT_LOCKED' }),
      );
    });

    it('lanza ForbiddenError si la cuenta está inactiva', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: '123' }, mockContext),
      ).rejects.toThrow(ForbiddenError);
    });

    it('lanza UnauthorizedError si la contraseña es incorrecta', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      vi.spyOn(passwordUtils.passwordUtils, 'verify').mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }, mockContext),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockAuthRepository.incrementFailedLogins).toHaveBeenCalledWith(mockUser.id);
      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED', failureReason: 'INVALID_PASSWORD' }),
      );
    });

    it('bloquea la cuenta tras MAX intentos fallidos', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4, // el siguiente intento llega a 5
      });
      vi.spyOn(passwordUtils.passwordUtils, 'verify').mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }, mockContext),
      ).rejects.toThrow(ForbiddenError);

      expect(mockAuthRepository.lockUser).toHaveBeenCalledOnce();
      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ACCOUNT_LOCKED' }),
      );
    });

    it('devuelve tokens si las credenciales son correctas', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);
      vi.spyOn(passwordUtils.passwordUtils, 'verify').mockResolvedValue(true);
      vi.spyOn(jwtUtils.jwtUtils, 'signAccessToken').mockReturnValue('access_token');
      vi.spyOn(jwtUtils.jwtUtils, 'signRefreshToken').mockReturnValue({
        token: 'refresh_token',
        jti: 'jti_value',
      });
      mockAuthRepository.saveRefreshToken.mockResolvedValue({});
      mockAuthRepository.resetFailedLogins.mockResolvedValue({});

      const result = await service.login(
        { email: 'test@example.com', password: 'correct' },
        mockContext,
      );

      expect(result).toEqual({ accessToken: 'access_token', refreshToken: 'refresh_token' });
      expect(mockAuthRepository.resetFailedLogins).toHaveBeenCalledWith(mockUser.id);
      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_SUCCESS', success: true }),
      );
    });
  });

  describe('refresh', () => {
    it('lanza UnauthorizedError si el token no existe en BD', async () => {
      vi.spyOn(jwtUtils.jwtUtils, 'verifyRefreshToken').mockReturnValue({
        sub: mockUser.id,
        jti: 'jti',
      });
      mockAuthRepository.findRefreshToken.mockResolvedValue(null);

      await expect(service.refresh('invalid_token', mockContext)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('lanza UnauthorizedError si el token ha expirado', async () => {
      vi.spyOn(jwtUtils.jwtUtils, 'verifyRefreshToken').mockReturnValue({
        sub: mockUser.id,
        jti: 'jti',
      });
      mockAuthRepository.findRefreshToken.mockResolvedValue({
        id: 'token_id',
        expiresAt: new Date(Date.now() - 1000), // expirado
      });

      await expect(service.refresh('expired_token', mockContext)).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('rota el refresh token y devuelve nuevos tokens', async () => {
      vi.spyOn(jwtUtils.jwtUtils, 'verifyRefreshToken').mockReturnValue({
        sub: mockUser.id,
        jti: 'jti',
      });
      mockAuthRepository.findRefreshToken.mockResolvedValue({
        id: 'token_id',
        expiresAt: new Date(Date.now() + 60_000),
      });
      mockAuthRepository.findUserById.mockResolvedValue(mockUser);
      vi.spyOn(jwtUtils.jwtUtils, 'signAccessToken').mockReturnValue('new_access_token');
      vi.spyOn(jwtUtils.jwtUtils, 'signRefreshToken').mockReturnValue({
        token: 'new_refresh_token',
        jti: 'new_jti',
      });
      mockAuthRepository.saveRefreshToken.mockResolvedValue({});

      const result = await service.refresh('valid_token', mockContext);

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
      expect(mockAuthRepository.revokeRefreshToken).toHaveBeenCalledWith('token_id');
    });
  });

  describe('logout', () => {
    it('revoca el refresh token si existe', async () => {
      mockAuthRepository.findRefreshToken.mockResolvedValue({
        id: 'token_id',
        userId: mockUser.id,
      });

      await service.logout('valid_token', mockContext);

      expect(mockAuthRepository.revokeRefreshToken).toHaveBeenCalledWith('token_id');
      expect(mockLoginAuditRepository.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT', success: true }),
      );
    });

    it('no lanza error si el refresh token no existe', async () => {
      mockAuthRepository.findRefreshToken.mockResolvedValue(null);
      await expect(service.logout('invalid_token', mockContext)).resolves.toBeUndefined();
    });
  });
});
