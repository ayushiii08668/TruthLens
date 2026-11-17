const request = require('supertest');
const store = require('./mockDb');
const mocks = require('./mocks');

jest.mock('../src/models', () => mocks);

const app = require('../src/app');

describe('Dashboard Analytics Suite', () => {
  let userToken;

  beforeEach(async () => {
    store.reset();

    const reg = await request(app).post('/api/auth/register').send({
      name: 'Data Analyst',
      email: 'analyst@truthlens.com',
      password: 'Password123!'
    });
    userToken = reg.body.data.token;

    // Create 2 investigations
    await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        originalInput: 'Solar generation accounted for 30 percent of European summer energy in 2026.',
        inputType: 'text'
      });

    await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        originalInput: 'New archaeological findings reveal bronze-age settlement in northern Greece.',
        inputType: 'headline'
      });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return aggregated metrics for user', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalInvestigations).toBe(2);
      expect(res.body.data.totalReports).toBeGreaterThanOrEqual(2);
      expect(res.body.data.verdicts).toBeDefined();
      expect(res.body.data.inputTypes).toBeDefined();
      expect(res.body.data.inputTypes.text).toBe(1);
      expect(res.body.data.inputTypes.headline).toBe(1);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should return recent investigations and reports', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recentInvestigations.length).toBe(2);
      expect(res.body.data.recentReports.length).toBeGreaterThanOrEqual(2);
    });
  });
});

