const request = require('supertest');
const app = require('../src/app');

describe('Health and Info Check Endpoints', () => {
  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
    expect(res.body.service).toEqual('truthlens-backend');
  });

  it('GET /api should return platform metadata', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toEqual(200);
    expect(res.body.tagline).toBe("Don't Just Believe It. Verify It.");
  });

  it('GET /api/unknown-route should return 404', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

