const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('3. Order Lifecycle, Random Chef Assignment & Email on Delivery', () => {
  let adminToken;
  let userToken;
  let user2Token;
  let chef1Token;
  let chef1Id;
  let chef2Id;
  let sampleDishId;
  let sampleDishPrice;
  let orderId;

  beforeAll(async () => {
    // 1. Create Admin
    const adminRes = await request(app).post('/api/auth/signup').send({
      name: 'Admin',
      email: 'admin.orders@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = adminRes.body.token;

    // 2. Create 2 Chefs for random assignment testing
    const chef1Res = await request(app).post('/api/auth/signup').send({
      name: 'Chef Ranveer',
      email: 'chef.ranveer@example.com',
      password: 'password123',
      role: 'chef',
    });
    chef1Token = chef1Res.body.token;
    chef1Id = chef1Res.body.user.id;

    const chef2Res = await request(app).post('/api/auth/signup').send({
      name: 'Chef Vikas',
      email: 'chef.vikas@example.com',
      password: 'password123',
      role: 'chef',
    });
    chef2Id = chef2Res.body.user.id;

    // 3. Create 2 Users
    const userRes = await request(app).post('/api/auth/signup').send({
      name: 'Kavita Roy',
      email: 'kavita@example.com',
      password: 'password123',
      role: 'user',
    });
    userToken = userRes.body.token;

    const user2Res = await request(app).post('/api/auth/signup').send({
      name: 'Rohan Joshi',
      email: 'rohan@example.com',
      password: 'password123',
      role: 'user',
    });
    user2Token = user2Res.body.token;

    // 4. Create Dish as Admin
    const dishRes = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Shahi Paneer',
        description: 'Royal cottage cheese in cashew cream gravy',
        price: 260.0,
        category: 'Main Course',
        isAvailable: true,
      });
    sampleDishId = dishRes.body.dish._id;
    sampleDishPrice = dishRes.body.dish.price;
  });

  it('should allow user to place an order, set initial status to "Order Received", and assign random chef', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ dishId: sampleDishId, quantity: 2 }],
        deliveryAddress: 'Flat 101, Green Heights, Andheri, Mumbai',
        contactPhone: '+919876543210',
        specialInstructions: 'Make it extra mild',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('Order Received'); // Strict requirement
    expect(res.body.order.totalAmount).toBe(sampleDishPrice * 2);

    // Verify chef assignment is one of the registered chefs
    const assignedChefId = res.body.order.assignedChef._id || res.body.order.assignedChef;
    expect([chef1Id, chef2Id]).toContain(assignedChefId.toString());

    orderId = res.body.order._id;
  });

  it('should allow user to view their own orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
    expect(res.body.orders[0]._id).toBe(orderId);
  });

  it('should prevent other users from viewing orders that do not belong to them', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow user to update their own order while status is "Order Received"', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        deliveryAddress: 'Updated Address: Flat 102, Green Heights, Mumbai',
        specialInstructions: 'Please ring bell twice',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.deliveryAddress).toContain('Flat 102');
  });

  it('should allow chef to update order status to "Preparing"', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`) // Admin or assigned chef can update
      .send({ status: 'Preparing' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('Preparing');
  });

  it('should forbid regular user from updating order once status is "Preparing"', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ deliveryAddress: 'Another changed address' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow chef to update order status to "Out for Delivery"', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Out for Delivery' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('Out for Delivery');
  });

  it('should update status to "Delivered" and trigger email dispatch to user with order details', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Delivered' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('Delivered');
    expect(res.body.order.deliveredAt).toBeDefined();
    expect(res.body).toHaveProperty('emailDispatched');
  });

  it('should forbid regular user from changing order status (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'Delivered' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
