const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('2. Dishes Management & Admin Role-Based Access Control', () => {
  let adminToken;
  let userToken;
  let dishId;

  beforeAll(async () => {
    // 1. Create Admin
    const adminRes = await request(app).post('/api/auth/signup').send({
      name: 'Admin User',
      email: 'admin.dishes@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = adminRes.body.token;

    // 2. Create Regular User
    const userRes = await request(app).post('/api/auth/signup').send({
      name: 'Regular Customer',
      email: 'user.dishes@example.com',
      password: 'password123',
      role: 'user',
    });
    userToken = userRes.body.token;
  });

  it('should allow Admin to create a new dish', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Butter Chicken',
        description: 'Tender chicken in butter tomato gravy with aromatic spices',
        price: 320.0,
        category: 'Main Course',
        cuisine: 'North Indian',
        isAvailable: true,
        preparationTimeMinutes: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.dish.name).toBe('Butter Chicken');
    expect(res.body.dish.price).toBe(320.0);
    dishId = res.body.dish._id;
  });

  it('should forbid regular user from creating a dish (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Hacker Dish',
        description: 'Should not be allowed',
        price: 100,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow public access to view all dishes', async () => {
    const res = await request(app).get('/api/dishes');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.dishes)).toBe(true);
    expect(res.body.dishes.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow public access to view a single dish by ID', async () => {
    const res = await request(app).get(`/api/dishes/${dishId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dish._id).toBe(dishId);
  });

  it('should allow Admin to update a dish', async () => {
    const res = await request(app)
      .put(`/api/dishes/${dishId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 350.0,
        description: 'Updated premium butter chicken recipe',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dish.price).toBe(350.0);
  });

  it('should forbid regular user from updating a dish', async () => {
    const res = await request(app)
      .put(`/api/dishes/${dishId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 10.0 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow Admin to delete a dish', async () => {
    const res = await request(app)
      .delete(`/api/dishes/${dishId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const verifyRes = await request(app).get(`/api/dishes/${dishId}`);
    expect(verifyRes.status).toBe(404);
  });
});
