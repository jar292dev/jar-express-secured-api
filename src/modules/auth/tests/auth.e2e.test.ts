import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../database/prisma.client';

const testUser = {
  email: `e2e-auth-${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
};

function extractCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  const raw = Array.isArray(cookies) ? cookies : [cookies];
  return raw.map((cookie) => cookie.split(';')[0]);
}

let userId: string;

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  if (userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.userLoginAudit.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('Auth E2E', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registra un usuario correctamente', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.data.message).toBeDefined();
    });

    it('devuelve 409 si el email ya existe', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(409);
    });

    it('devuelve 400 si el body es inválido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'no-es-un-email', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('devuelve 401 con credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrong_password' });

      expect(res.status).toBe(401);
    });

    it('login correcto — setea cookies y devuelve mensaje', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      // Obtener userId para limpieza
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      userId = user!.id;
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('devuelve 401 sin refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('renueva el token con refresh token válido', async () => {
      // Login para obtener cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('devuelve 401 sin autenticación', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(401);
    });

    it('logout correcto — limpia cookies', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app).post('/api/v1/auth/logout').set('Cookie', cookies);

      expect(res.status).toBe(204);
    });
  });
});
