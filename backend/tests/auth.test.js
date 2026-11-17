const request = require('supertest');
const store = require('./mockDb');
const mocks = require('./mocks');

jest.mock('../src/models', () => mocks);

const app = require('../src/app');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Authentication API Suite', () => {
  beforeEach(() => {
    store.reset();
  });

  const validUserData = {
    name: 'Verified Analyst',
    email: 'analyst@truthlens.com',
    password: 'SecurePassword123!',
    role: 'analyst'
  };

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.name).toBe(validUserData.name);
      expect(res.body.data.user.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject registration if email is already registered', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUserData);

      // Duplicate registration attempt
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('should return 400 for invalid request body (missing fields, short password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUserData);
    });

    it('should log in successfully with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(validUserData.email.toLowerCase());
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword456!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Protected Endpoints & Token Validation (/api/auth/me, /api/auth/profile)', () => {
    let validToken;
    let registeredUser;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send(validUserData);
      validToken = reg.body.data.token;
      registeredUser = reg.body.data.user;
    });

    it('should return 401 when Authorization token is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/token is required/i);
    });

    it('should return 401 when token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid authentication token/i);
    });

    it('should return 401 when token is expired', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: registeredUser._id, role: registeredUser.role },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/expired/i);
    });

    it('should return current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUserData.email.toLowerCase());
    });

    it('should update user profile successfully', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Senior Verified Analyst'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Senior Verified Analyst');
    });

    it('should successfully log out', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Password Reset Workflow', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUserData);
    });

    it('should generate reset token and allow password reset', async () => {
      // 1. Request reset
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUserData.email });

      expect(forgotRes.statusCode).toBe(200);
      expect(forgotRes.body.data.resetToken).toBeDefined();

      const { resetToken } = forgotRes.body.data;

      // 2. Perform reset
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'BrandNewSecurePassword789!' });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'BrandNewSecurePassword789!'
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });

    it('should reject reset with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/totally-invalid-token')
        .send({ password: 'BrandNewPassword123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

