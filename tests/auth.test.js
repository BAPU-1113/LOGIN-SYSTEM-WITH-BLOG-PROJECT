const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('1. User Authentication & Password Reset Flow', () => {
  const testUser = {
    name: 'Aarav Mehta',
    email: 'aarav.test@example.com',
    password: 'securePassword123',
    role: 'user',
    phone: '+919876543210',
  };

  const testChef = {
    name: 'Chef Sanjeev',
    email: 'chef.test@example.com',
    password: 'chefPassword123',
    role: 'chef',
  };

  const testAdmin = {
    name: 'Admin Boss',
    email: 'admin.test@example.com',
    password: 'adminPassword123',
    role: 'admin',
  };

  let userToken;
  let resetToken;

  it('should successfully register a new user with hashed password and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password).toBeUndefined(); // Password must never be exposed
  });

  it('should reject registration if email is already registered', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should register a chef and admin with specified roles', async () => {
    const resChef = await request(app).post('/api/auth/signup').send(testChef);
    expect(resChef.status).toBe(201);
    expect(resChef.body.user.role).toBe('chef');

    const resAdmin = await request(app).post('/api/auth/signup').send(testAdmin);
    expect(resAdmin.status).toBe(201);
    expect(resAdmin.body.user.role).toBe('admin');
  });

  it('should log in with valid credentials and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrong_password',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should access protected profile route /api/auth/me with Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject access to protected route if token is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should handle forgot-password and dispatch reset email with token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('resetToken');
    resetToken = res.body.resetToken;
  });

  it('should reset password successfully using valid reset token', async () => {
    const res = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ password: 'brandNewPassword456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'brandNewPassword456',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it('should reject password reset if token is invalid or expired', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/invalid_dummy_token_12345')
      .send({ password: 'anotherNewPassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
