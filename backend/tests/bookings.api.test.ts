import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

/** Exercise durable booking creation against an isolated file-backed SQLite database. */
describe('bookings API', () => {
  const jwtSecret = 'test-secret-that-is-long-enough';
  let database: Database.Database;
  let databasePath: string;
  let token: string;

  beforeEach(async () => {
    databasePath = path.join(os.tmpdir(), `bookmyshow-bookings-${Date.now()}-${Math.random()}.db`);
    database = createDatabase(databasePath);
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });
    token = (await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' })).body.token as string;
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
  });

  /** Reject booking creation without a verified bearer token. */
  it('returns 401 when authentication is absent', async () => {
    const response = await request(createApp(database, jwtSecret, ['http://localhost:3000'])).post('/api/v1/bookings').send({});
    expect(response.status).toBe(401);
  });

  /** Persists a valid mapped booking and returns joined catalogue confirmation details. */
  it('creates a booking and persists the re-queryable SQLite record', async () => {
    const response = await request(createApp(database, jwtSecret, ['http://localhost:3000']))
      .post('/api/v1/bookings').set('Authorization', `Bearer ${token}`)
      .send({ movieId: 1, theatreId: 1, seats: ['A1', 'A2', 'A3'], paymentMethod: 'card', totalPrice: 450 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ confirmationId: expect.any(Number), movie: { id: 1, title: 'Paradise' }, theatre: { id: 1, name: 'Sandhya 70mm' }, seats: ['A1', 'A2', 'A3'], paymentMethod: 'card', totalPrice: 450 });
    const record = database.prepare('SELECT user_id, movie_id, theatre_id, seats, payment_method, total_price FROM bookings WHERE id = ?').get(response.body.confirmationId) as { user_id: number; movie_id: number; theatre_id: number; seats: string; payment_method: string; total_price: number };
    expect(record).toEqual({ user_id: 1, movie_id: 1, theatre_id: 1, seats: '["A1","A2","A3"]', payment_method: 'card', total_price: 450 });
  });

  /** Reject totals that cannot be derived from the chosen seats. */
  it('returns 400 when totalPrice does not equal the seat count price', async () => {
    const response = await request(createApp(database, jwtSecret, ['http://localhost:3000']))
      .post('/api/v1/bookings').set('Authorization', `Bearer ${token}`)
      .send({ movieId: 1, theatreId: 1, seats: ['A1'], paymentMethod: 'upi', totalPrice: 450 });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('totalPrice');
  });

  /** Reject unmapped theatres and distinguish absent catalogue resources. */
  it('returns 400 for an unmapped theatre and 404 for unknown IDs', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const unmapped = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({ movieId: 1, theatreId: 3, seats: ['A1'], paymentMethod: 'card', totalPrice: 150 });
    const unknownMovie = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({ movieId: 99, theatreId: 1, seats: ['A1'], paymentMethod: 'card', totalPrice: 150 });
    const unknownTheatre = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({ movieId: 1, theatreId: 99, seats: ['A1'], paymentMethod: 'card', totalPrice: 150 });
    expect(unmapped.status).toBe(400);
    expect(unknownMovie.status).toBe(404);
    expect(unknownTheatre.status).toBe(404);
  });

  /** Reject duplicate or malformed seat identifiers at the validation boundary. */
  it('returns 400 for duplicate or invalid seat strings', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const duplicate = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({ movieId: 1, theatreId: 1, seats: ['A1', 'A1'], paymentMethod: 'card', totalPrice: 300 });
    const malformed = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({ movieId: 1, theatreId: 1, seats: ['Z9'], paymentMethod: 'card', totalPrice: 150 });
    expect(duplicate.status).toBe(400);
    expect(malformed.status).toBe(400);
  });
});
