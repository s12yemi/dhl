const request = require('supertest');
const app = require('./server');

describe('GET /', () => {
    it('should return status 200 and a success message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'success');
    });
});