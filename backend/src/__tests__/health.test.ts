import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('reports the server as running', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'OK', message: 'Server is running' });
  });
});
