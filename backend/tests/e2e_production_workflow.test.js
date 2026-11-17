const request = require('supertest');
const store = require('./mockDb');
const mocks = require('./mocks');

jest.mock('../src/models', () => mocks);

const app = require('../src/app');

describe('Final Production End-to-End Workflow Test (Phase 10)', () => {
  let userToken;
  let userId;
  let investigationId;
  let reportId;
  let shareId;

  beforeAll(() => {
    store.reset();
  });

  it('Step 1-3: Register a new analyst account and authenticate', async () => {
    const email = `analyst_${Date.now()}@truthlens.ai`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Chief Fact Analyst',
        email,
        password: 'SecurePassword2026!'
      });

    expect(regRes.statusCode).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeDefined();
    expect(regRes.body.data.user.email).toBe(email);

    userToken = regRes.body.data.token;
    userId = regRes.body.data.user._id;

    // Login validation
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'SecurePassword2026!'
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it('Step 4-7: Submit a real factual claim, extract claim, retrieve evidence, and generate assessment', async () => {
    const claimInput = 'NASA launched the Europa Clipper spacecraft on a 1.8-billion-mile journey to Jupiter icy moon.';
    
    const invRes = await request(app)
      .post('/api/investigations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        originalInput: claimInput,
        inputType: 'headline'
      });

    expect(invRes.statusCode).toBe(201);
    expect(invRes.body.success).toBe(true);
    expect(invRes.body.data.investigation).toBeDefined();
    expect(invRes.body.data.reports).toBeDefined();
    expect(invRes.body.data.reports.length).toBeGreaterThanOrEqual(1);

    investigationId = invRes.body.data.investigation._id;
    const report = invRes.body.data.reports[0];
    reportId = report._id;

    // Verify assessment fields
    expect(report.verdict).toBeDefined();
    expect(report.confidence).toBeGreaterThanOrEqual(0);
    expect(report.confidence).toBeLessThanOrEqual(100);
    expect(report.explanation).toBeDefined();
    expect(report.timeline).toBeDefined();
    expect(report.timeline.length).toBe(5);
  });

  it('Step 8: Verify discovered source links and citations', async () => {
    const repRes = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(repRes.statusCode).toBe(200);
    const report = repRes.body.data.report;

    const allEvidence = [
      ...(report.supportingEvidence || []),
      ...(report.contradictingEvidence || []),
      ...(report.neutralEvidence || [])
    ];

    expect(allEvidence.length).toBeGreaterThan(0);
    allEvidence.forEach(ev => {
      expect(ev.sourceUrl).toBeDefined();
      expect(ev.sourceName).toBeDefined();
      expect(ev.quote).toBeDefined();
      expect(ev.stance).toBeDefined();
    });
  });

  it('Step 9: Save the dossier to library / bookmarks', async () => {
    const saveRes = await request(app)
      .post(`/api/reports/${reportId}/save`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(saveRes.statusCode).toBe(201);
    expect(saveRes.body.success).toBe(true);
  });

  it('Step 10: Reopen dossier from saved library and investigation history', async () => {
    // Check saved library
    const savedRes = await request(app)
      .get('/api/reports/saved')
      .set('Authorization', `Bearer ${userToken}`);

    expect(savedRes.statusCode).toBe(200);
    expect(savedRes.body.data.reports.length).toBe(1);
    expect(savedRes.body.data.reports[0]._id).toBe(reportId);

    // Check investigation history
    const historyRes = await request(app)
      .get('/api/investigations')
      .set('Authorization', `Bearer ${userToken}`);

    expect(historyRes.statusCode).toBe(200);
    expect(historyRes.body.data.investigations.length).toBe(1);
    expect(historyRes.body.data.investigations[0]._id).toBe(investigationId);
  });

  it('Step 11: Enable public sharing and verify unauthenticated access', async () => {
    const shareRes = await request(app)
      .patch(`/api/reports/${reportId}/share`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isPublic: true });

    expect(shareRes.statusCode).toBe(200);
    expect(shareRes.body.data.isPublic).toBe(true);
    shareId = shareRes.body.data.shareId;
    expect(shareId).toBeDefined();

    // Access via public unauthenticated endpoint
    const pubRes = await request(app)
      .get(`/api/reports/public/${shareId}`);

    expect(pubRes.statusCode).toBe(200);
    expect(pubRes.body.data.report.claim).toBeDefined();
    expect(pubRes.body.data.report.verdict).toBeDefined();
    // Verify privacy: userId is not exposed
    expect(pubRes.body.data.report.userId).toBeUndefined();
  });
});
