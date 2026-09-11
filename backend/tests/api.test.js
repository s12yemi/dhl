const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Shipment = require('../models/Shipment');

const MONGO_TEST_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dhl-clone-test';

beforeAll(async () => {
  // Disconnect from server.js's connection first if it's already active
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(MONGO_TEST_URI);
});

afterAll(async () => {
  // Clean up databases and close connection
  await User.deleteMany({});
  await Shipment.deleteMany({});
  await mongoose.connection.close();
});

describe('DHL Shipping Clone API Test Suite', () => {
  let userToken = '';
  let consignmentNumber = '';

  // 1. Rate Calculator API Test
  test('POST /api/shipments/calculate-rate - Should calculate price correctly', async () => {
    const res = await request(app)
      .post('/api/shipments/calculate-rate')
      .send({
        weight: 5,
        length: 20,
        width: 15,
        height: 10,
        serviceType: 'Express'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('totalPrice');
    expect(res.body).toHaveProperty('basePrice');
    expect(parseFloat(res.body.totalPrice)).toBeGreaterThan(0);
  });

  // 2. Auth APIs Test
  test('POST /api/auth/register - Should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testuser@dhl.com',
        password: 'securePassword123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toContain('registered successfully');
  });

  test('POST /api/auth/login - Should log in and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@dhl.com',
        password: 'securePassword123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  // 3. Booking API Test
  test('POST /api/shipments/book - Should fail without authentication token', async () => {
    const res = await request(app)
      .post('/api/shipments/book')
      .send({
        sender: { name: 'Sender Name', address: '123 Main St', city: 'Mumbai', country: 'India', email: 'sender@mail.com' },
        receiver: { name: 'Receiver Name', address: '456 Broadway', city: 'New York', country: 'USA', email: 'recv@mail.com' },
        packageDetails: { weight: 2, length: 12, width: 12, height: 12, contents: 'Books' },
        price: 45.50
      });

    expect(res.statusCode).toEqual(401);
  });

  test('POST /api/shipments/book - Should book a shipment and return consignment details', async () => {
    const res = await request(app)
      .post('/api/shipments/book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sender: { name: 'Sender Name', address: '123 Main St', city: 'Mumbai', country: 'India', email: 'sender@mail.com' },
        receiver: { name: 'Receiver Name', address: '456 Broadway', city: 'New York', country: 'USA', email: 'recv@mail.com' },
        packageDetails: { weight: 2, length: 12, width: 12, height: 12, contents: 'Books' },
        price: 45.50
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.shipment).toHaveProperty('consignmentNumber');
    consignmentNumber = res.body.shipment.consignmentNumber;
  });

  // 4. Tracking API Test
  test('GET /api/shipments/track/:consignmentNumber - Should track shipment successfully', async () => {
    const res = await request(app)
      .get(`/api/shipments/track/${consignmentNumber}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.consignmentNumber).toEqual(consignmentNumber);
    expect(res.body.status).toEqual('Booked');
  });

  test('GET /api/shipments/track/:consignmentNumber - Should return 404 for invalid consignment number', async () => {
    const res = await request(app)
      .get('/api/shipments/track/DHL-INVALID-NO-IN');

    expect(res.statusCode).toEqual(404);
  });
});
