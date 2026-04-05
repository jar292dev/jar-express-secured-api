import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../database/prisma.client';

let adminCookies: string[] = [];
let userCookies: string[] = [];
let createdUserId: string;
let testNormalUserId: string;

const adminCredentials = {
  email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
  password: process.env.ADMIN_PASSWORD ?? 'Admin1234!',
};

function extractCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  const raw = Array.isArray(cookies) ? cookies : [cookies];
  return raw.map((cookie) => cookie.split(';')[0]);
}

const normalUserEmail = `e2e-me-${Date.now()}@example.com`;
const normalUserPassword = 'Password123!';

const testUserData = {
  email: `e2e-user-${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'E2E',
  lastName: 'User',
  role: 'user' as const,
  isActive: true,
};

beforeAll(async () => {
  await prisma.$connect();

  // Login como admin
  const adminLogin = await request(app).post('/api/v1/auth/login').send(adminCredentials);
  adminCookies = extractCookies(adminLogin);

  // Registrar usuario normal con email fijo en esta ejecución
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: normalUserEmail, password: normalUserPassword });

  // Login con el mismo email que se usó para registrar
  const userLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: normalUserEmail, password: normalUserPassword });
  userCookies = extractCookies(userLogin);

  // Guardar id para limpieza
  const normalUser = await prisma.user.findUnique({ where: { email: normalUserEmail } });
  if (normalUser) testNormalUserId = normalUser.id;
});

afterAll(async () => {
  // Limpiar usuario creado en tests
  if (createdUserId) {
    await prisma.refreshToken.deleteMany({ where: { userId: createdUserId } });
    await prisma.userLoginAudit.deleteMany({ where: { userId: createdUserId } });
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }

  // Limpiar usuario normal de test
  if (testNormalUserId) {
    await prisma.refreshToken.deleteMany({ where: { userId: testNormalUserId } });
    await prisma.userLoginAudit.deleteMany({ where: { userId: testNormalUserId } });
    await prisma.user.delete({ where: { id: testNormalUserId } }).catch(() => {});
  }

  await prisma.$disconnect();
});

describe('Users E2E', () => {
  describe('GET /api/v1/users/me', () => {
    it('devuelve el perfil del usuario autenticado', async () => {
      const res = await request(app).get('/api/v1/users/me').set('Cookie', userCookies.join('; '));

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(normalUserEmail);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('devuelve 401 sin autenticación', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users — solo admin', () => {
    it('lista usuarios correctamente', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', adminCookies.join('; '));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('devuelve 403 si no es admin', async () => {
      const res = await request(app).get('/api/v1/users').set('Cookie', userCookies.join('; '));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/users — solo admin', () => {
    it('crea un usuario correctamente', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookies.join('; '))
        .send(testUserData);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.passwordHash).toBeUndefined();
      createdUserId = res.body.data.id;
    });

    it('devuelve 409 si el email ya existe', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', adminCookies.join('; '))
        .send(testUserData);

      expect(res.status).toBe(409);
    });

    it('devuelve 403 si no es admin', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', userCookies.join('; '))
        .send(testUserData);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/users/:id — solo admin', () => {
    it('devuelve el usuario por id', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${createdUserId}`)
        .set('Cookie', adminCookies.join('; '));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdUserId);
    });

    it('devuelve 404 si no existe', async () => {
      const res = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', adminCookies.join('; '));

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/users/:id — solo admin', () => {
    it('actualiza un usuario correctamente', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${createdUserId}`)
        .set('Cookie', adminCookies.join('; '))
        .send({ firstName: 'Actualizado' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Actualizado');
    });
  });

  describe('DELETE /api/v1/users/:id — solo admin', () => {
    it('elimina un usuario correctamente', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${createdUserId}`)
        .set('Cookie', adminCookies.join('; '));

      expect(res.status).toBe(204);
      createdUserId = '';
    });

    it('devuelve 403 si intenta borrarse a sí mismo', async () => {
      const meRes = await request(app)
        .get('/api/v1/users/me')
        .set('Cookie', adminCookies.join('; '));

      const res = await request(app)
        .delete(`/api/v1/users/${meRes.body.data.id}`)
        .set('Cookie', adminCookies.join('; '));

      expect(res.status).toBe(403);
    });
  });
});
