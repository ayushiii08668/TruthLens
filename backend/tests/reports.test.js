const request = require('supertest');
const store = require('./mockDb');
const mocks = require('./mocks');

jest.mock('../src/models', () => mocks);

const app = require('../src/app');

describe('Verification Reports & Bookmarks Suite', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;
  let reportId;

  beforeEach(async () => {
    store.reset();

    // User A
    const regA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: 'user.a@truthlens.com',
      password: 'Password123!'
    });
    userAToken = regA.body.data.token;
    userAId = regA.body.data.user._id;

    // User B
    const regB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: 'user.b@truthlens.com',
      password: 'Password123!'
    });
    userBToken = regB.body.data.token;
    userBId = regB.body.data.user._id;

    // Create an investigation for User A which generates reports
    const invRes = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        originalInput: 'Autonomous electric freight vessels commenced commercial transatlantic voyages in 2026.',
        inputType: 'headline'
      });

    reportId = invRes.body.data.reports[0]._id;
  });

  describe('GET /api/reports/:id', () => {
    it('should return report details for the owner', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report._id).toBe(reportId);
      expect(res.body.data.report.verdict).toBeDefined();
      expect(res.body.data.isSaved).toBe(false);
    });

    it('should forbid User B from accessing User A report (403)', async () => {
      const res = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-existent report ID', async () => {
      const res = await request(app)
        .get('/api/reports/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/reports/:id/save and DELETE /api/reports/:id/save', () => {
    it('should save/bookmark a report and list it in /saved', async () => {
      // 1. Save report
      const saveRes = await request(app)
        .post(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(saveRes.statusCode).toBe(201);
      expect(saveRes.body.success).toBe(true);

      // 2. Fetch saved list
      const listRes = await request(app)
        .get('/api/reports/saved')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.reports.length).toBe(1);
      expect(listRes.body.data.reports[0]._id).toBe(reportId);

      // 3. Verify report endpoint now shows isSaved = true
      const getRes = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(getRes.body.data.isSaved).toBe(true);
    });

    it('should handle duplicate save idempotently', async () => {
      await request(app)
        .post(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      const dupRes = await request(app)
        .post(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(dupRes.statusCode).toBe(200);
      expect(dupRes.body.message).toMatch(/already saved/i);
    });

    it('should prevent user from saving another user report (403)', async () => {
      const res = await request(app)
        .post(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should remove report from saved bookmarks', async () => {
      // Save first
      await request(app)
        .post(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Unsave
      const unsaveRes = await request(app)
        .delete(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(unsaveRes.statusCode).toBe(200);

      // Check list is empty
      const listRes = await request(app)
        .get('/api/reports/saved')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.body.data.reports.length).toBe(0);
    });

    it('should return 404 when trying to unsave a report not in saved list', async () => {
      const res = await request(app)
        .delete(`/api/reports/${reportId}/save`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Public Sharing Suite (PATCH /:id/share and GET /public/:shareId)', () => {
    it('should allow report owner to toggle public sharing on and off', async () => {
      // 1. Enable sharing
      const shareRes = await request(app)
        .patch(`/api/reports/${reportId}/share`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ isPublic: true });

      expect(shareRes.statusCode).toBe(200);
      expect(shareRes.body.success).toBe(true);
      expect(shareRes.body.data.isPublic).toBe(true);
      expect(shareRes.body.data.shareId).toMatch(/^tl_/);

      const shareId = shareRes.body.data.shareId;

      // 2. Fetch via unauthenticated public endpoint
      const pubRes = await request(app)
        .get(`/api/reports/public/${shareId}`);

      expect(pubRes.statusCode).toBe(200);
      expect(pubRes.body.success).toBe(true);
      expect(pubRes.body.data.report.claim).toBeDefined();
      expect(pubRes.body.data.report.verdict).toBeDefined();
      // Ensure user ID is not leaked in public view
      expect(pubRes.body.data.report.userId).toBeUndefined();

      // 3. Disable sharing
      const unshareRes = await request(app)
        .patch(`/api/reports/${reportId}/share`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ isPublic: false });

      expect(unshareRes.statusCode).toBe(200);
      expect(unshareRes.body.data.isPublic).toBe(false);

      // 4. Public endpoint now returns 404
      const revPubRes = await request(app)
        .get(`/api/reports/public/${shareId}`);

      expect(revPubRes.statusCode).toBe(404);
    });

    it('should forbid User B from toggling sharing on User A report (403)', async () => {
      const res = await request(app)
        .patch(`/api/reports/${reportId}/share`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ isPublic: true });

      expect(res.statusCode).toBe(403);
    });
  });
});

