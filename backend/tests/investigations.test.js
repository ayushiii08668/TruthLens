const request = require('supertest');
const store = require('./mockDb');
const mocks = require('./mocks');

jest.mock('../src/models', () => mocks);

const app = require('../src/app');

describe('Investigations API Suite', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  beforeEach(async () => {
    store.reset();

    // Register User A
    const regA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: 'user.a@truthlens.com',
      password: 'Password123!'
    });
    userAToken = regA.body.data.token;
    userAId = regA.body.data.user._id;

    // Register User B
    const regB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: 'user.b@truthlens.com',
      password: 'Password123!'
    });
    userBToken = regB.body.data.token;
    userBId = regB.body.data.user._id;
  });

  describe('POST /api/investigations', () => {
    it('should create an investigation and extract claims with preliminary reports', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          originalInput: 'Inflation decreased by 2.1 percent across the OECD area in the third quarter of 2026.',
          inputType: 'text'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investigation).toBeDefined();
      expect(res.body.data.investigation.originalInput).toContain('Inflation decreased');
      expect(res.body.data.investigation.extractedClaims.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.reports).toBeDefined();
      expect(res.body.data.reports.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 400 for invalid input body (missing originalInput or invalid inputType)', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          originalInput: '',
          inputType: 'invalid_type'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .send({
          originalInput: 'Some valid claim statement.',
          inputType: 'headline'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should create a URL investigation and store article metadata', async () => {
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          originalInput: 'https://reuters.com/world/science/europa-clipper-launch-2024',
          inputType: 'url'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investigation.inputType).toBe('url');
      expect(res.body.data.investigation.metadata.pageTitle).toBeDefined();
    });

    it('should support image media upload with caption', async () => {
      const dummyBuffer = Buffer.from('fake-image-bytes-header');
      const res = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .field('inputType', 'image')
        .field('caption', 'Wildfire smoke plume captured in northern hills')
        .attach('image', dummyBuffer, 'wildfire_plume.jpg');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investigation.inputType).toBe('image');
    });
  });

  describe('GET /api/investigations and /:id', () => {
    let investigationId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          originalInput: 'Global clean energy investments exceeded fossil fuels by 75 percent.',
          inputType: 'headline'
        });
      investigationId = createRes.body.data.investigation._id;
    });

    it('should list investigations for authenticated user with pagination meta', async () => {
      const res = await request(app)
        .get('/api/investigations?page=1&limit=10')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.investigations.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.meta.page).toBe(1);
    });

    it('should fetch single investigation details including reports for the owner', async () => {
      const res = await request(app)
        .get(`/api/investigations/${investigationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.investigation._id).toBe(investigationId);
      expect(res.body.data.reports).toBeDefined();
    });

    it('should return 403 when User B attempts to access User A investigation', async () => {
      const res = await request(app)
        .get(`/api/investigations/${investigationId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/access denied/i);
    });

    it('should return 404 for non-existent investigation ID', async () => {
      const res = await request(app)
        .get('/api/investigations/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/investigations/:id', () => {
    let investigationId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/investigations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          originalInput: 'Statement to be deleted after fact-checking.',
          inputType: 'text'
        });
      investigationId = createRes.body.data.investigation._id;
    });

    it('should allow owner to delete investigation', async () => {
      const res = await request(app)
        .delete(`/api/investigations/${investigationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/investigations/${investigationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(checkRes.statusCode).toBe(404);
    });

    it('should prevent unauthorized deletion by another user (403)', async () => {
      const res = await request(app)
        .delete(`/api/investigations/${investigationId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});

