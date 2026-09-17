import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

/** Exercise protected catalogue routes against a temporary real SQLite database. */
describe('catalog API', () => {
  const jwtSecret = 'test-secret-that-is-long-enough';
  let database: Database.Database;
  let databasePath: string;
  let token: string;

  beforeEach(async () => {
    databasePath = path.join(os.tmpdir(), `bookmyshow-catalog-${Date.now()}-${Math.random()}.db`);
    database = createDatabase(databasePath);
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });
    const verification = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    token = verification.body.token as string;
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
  });

  /** Reject movie access when bearer credentials are absent. */
  it('rejects unauthenticated movie requests', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const response = await request(app).get('/api/v1/movies');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  /** Return exactly the seeded movies from SQLite. */
  it('returns the three seeded movies for an authenticated user', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const response = await request(app).get('/api/v1/movies').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.movies).toEqual([
      { id: 1, title: 'Paradise', posterLabel: 'Now showing' },
      { id: 2, title: 'Bloody Romeo', posterLabel: 'Now showing' },
      { id: 3, title: 'OG2', posterLabel: 'Now showing' }
    ]);
  });

  /** Return only theatres mapped to the requested movie. */
  it('returns mapped theatres for a movie', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const response = await request(app).get('/api/v1/theatres?movieId=1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.theatres).toEqual([
      { id: 1, name: 'Sandhya 70mm' },
      { id: 2, name: 'Sudharsham 70mm' }
    ]);
  });

  /** Reject missing and non-positive movie query values. */
  it('rejects missing and invalid movie queries', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const missing = await request(app).get('/api/v1/theatres').set('Authorization', `Bearer ${token}`);
    const invalid = await request(app).get('/api/v1/theatres?movieId=0').set('Authorization', `Bearer ${token}`);

    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(400);
    expect(missing.body.error).toBe('Invalid request');
    expect(invalid.body.error).toBe('Invalid request');
  });

  /** Return not found for a syntactically valid but absent movie. */
  it('returns 404 when the requested movie does not exist', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const response = await request(app).get('/api/v1/theatres?movieId=999').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Movie not found' });
  });
});
