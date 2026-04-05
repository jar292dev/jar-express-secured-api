import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import { prisma } from '../../../database/prisma.client';

let adminCookies: string[] = [];
let createdId: string;

function extractCookies(res: request.Response): string[] {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  const raw = Array.isArray(cookies) ? cookies : [cookies];
  return raw.map((cookie) => cookie.split(';')[0]);
}

beforeAll(async () => {
  await prisma.$connect();

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
      password: process.env.ADMIN_PASSWORD ?? 'Admin1234!',
    });

  adminCookies = extractCookies(loginRes);
});

afterAll(async () => {
  if (createdId) await prisma.notice.delete({ where: { id: createdId } }).catch(() => {});
  await prisma.$disconnect();
});

describe('Notices E2E', () => {
  it('POST /api/v1/notices — crea un notice', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Cookie', adminCookies.join('; '))
      .send({
        title: `E2E Test ${Date.now()}`,
        body: 'E2E body',
        level: 'info',
        isActive: true,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    createdId = res.body.data.id;
  });

  it('GET /api/v1/notices — lista notices', async () => {
    const res = await request(app).get('/api/v1/notices').set('Cookie', adminCookies.join('; '));

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toBeDefined();
  });

  it('GET /api/v1/notices/:id — obtiene un notice', async () => {
    const res = await request(app)
      .get(`/api/v1/notices/${createdId}`)
      .set('Cookie', adminCookies.join('; '));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PUT /api/v1/notices/:id — actualiza un notice', async () => {
    const res = await request(app)
      .put(`/api/v1/notices/${createdId}`)
      .set('Cookie', adminCookies.join('; '))
      .send({ title: 'E2E Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('E2E Actualizado');
  });

  it('GET /api/v1/notices/:id — 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/v1/notices/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookies.join('; '));

    expect(res.status).toBe(404);
  });

  it('GET /api/v1/notices — 401 sin autenticación', async () => {
    const res = await request(app).get('/api/v1/notices');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/v1/notices/:id — elimina un notice', async () => {
    const res = await request(app)
      .delete(`/api/v1/notices/${createdId}`)
      .set('Cookie', adminCookies.join('; '));
    expect(res.status).toBe(204);

    createdId = '';
  });
});
