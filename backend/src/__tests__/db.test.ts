import pool from '../db/connection';

// Requires a reachable Postgres instance (e.g. `docker-compose up -d db`).
describe('database connection', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('connects and executes a query', async () => {
    const result = await pool.query('SELECT 1 AS value');
    expect(result.rows[0].value).toBe(1);
  });
});
