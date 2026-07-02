import request from 'supertest';

jest.mock('../db/connection', () => ({
  __esModule: true,
  default: { query: jest.fn(), connect: jest.fn() },
}));

jest.mock('../utils/cache', () => ({
  __esModule: true,
  getFromCache: jest.fn().mockResolvedValue(null),
  setInCache: jest.fn().mockResolvedValue(undefined),
  deleteFromCache: jest.fn().mockResolvedValue(undefined),
  CACHE_KEYS: {
    PRODUCTS: 'products',
    PRODUCT: (id: string) => `product:${id}`,
  },
}));

import app from '../app';
import pool from '../db/connection';
import { getFromCache } from '../utils/cache';

const mockedQuery = pool.query as jest.Mock;
const mockedGetFromCache = getFromCache as jest.Mock;

beforeEach(() => {
  mockedQuery.mockReset();
  mockedGetFromCache.mockReset().mockResolvedValue(null);
});

describe('GET /api/products', () => {
  it('returns products from the database when uncached', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: '1', name: 'Widget' }] });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1', name: 'Widget' }]);
  });

  it('returns cached products without querying the database', async () => {
    mockedGetFromCache.mockResolvedValueOnce([{ id: '1', name: 'Cached Widget' }]);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: '1', name: 'Cached Widget' }]);
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 when the product does not exist', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/products/missing-id');

    expect(res.status).toBe(404);
  });
});
