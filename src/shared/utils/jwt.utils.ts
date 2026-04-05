import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string;
  jti: string; // JWT ID único
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export const jwtUtils = {
  signAccessToken(payload: Omit<AccessTokenPayload, 'jti'>): string {
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    });
  },

  signRefreshToken(userId: string): { token: string; jti: string } {
    const jti = crypto.randomUUID();
    const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });
    return { token, jti };
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  },

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  },
};
