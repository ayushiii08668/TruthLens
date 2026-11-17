const request = require('supertest');
const app = require('../src/app');

describe('Security & Error Handling Suite', () => {
  it('should include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('should serve Swagger OpenAPI specification at /api/docs.json', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.statusCode).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toContain('TruthLens');
    expect(res.body.paths['/auth/register']).toBeDefined();
    expect(res.body.paths['/investigations']).toBeDefined();
  });

  it('should return safe 404 for unknown routes without exposing stack traces', async () => {
    const res = await request(app).get('/api/completely-unknown-route-xyz');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('not found');
    expect(res.body.error.stack).toBeUndefined();
  });
});

