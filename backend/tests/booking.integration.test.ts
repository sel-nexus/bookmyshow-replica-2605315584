import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';

/** Verify the auth, catalogue, and booking flow against one durable isolated SQLite file. */
describe('booking integration', () => {
  const jwtSecret = 'test-secret-that-is-long-enough';
  let database: Database.Database;
  let databasePath: string;

  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `bookmyshow-integration-${Date.now()}-${Math.random()}.db`);
    database = createDatabase(databasePath);
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
  });

  it('chains login, verification, catalogue discovery, and a booking using returned mapped IDs', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const login = await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9123456789' });
    const verification = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9123456789', otp: '1234' });
    const token = verification.body.token as string;
    const movies = await request(app).get('/api/v1/movies').set('Authorization', `Bearer ${token}`);
    const movie = movies.body.movies.find((candidate: { title: string }) => candidate.title === 'Paradise') as { id: number; title: string; posterLabel: string };
    const theatres = await request(app).get(`/api/v1/theatres?movieId=${movie.id}`).set('Authorization', `Bearer ${token}`);
    const theatre = theatres.body.theatres[0] as { id: number; name: string };
    const booking = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({
      movieId: movie.id,
      theatreId: theatre.id,
      seats: ['B1', 'B2'],
      paymentMethod: 'upi',
      totalPrice: 300
    });

    expect(login.status).toBe(200);
    expect(login.body).toEqual({ message: 'OTP sent', mobileNumber: '9123456789' });
    expect(verification.status).toBe(200);
    expect(verification.body).toMatchObject({ token: expect.any(String), tokenType: 'Bearer' });
    expect(movies.status).toBe(200);
    expect(movie).toEqual({ id: 1, title: 'Paradise', posterLabel: 'Now showing' });
    expect(theatres.status).toBe(200);
    expect(theatre).toEqual({ id: 1, name: 'Sandhya 70mm' });
    expect(booking.status).toBe(201);
    expect(booking.body).toEqual({ confirmationId: expect.any(Number), movie: { id: movie.id, title: movie.title }, theatre, seats: ['B1', 'B2'], paymentMethod: 'upi', totalPrice: 300 });
    expect(database.prepare('SELECT u.mobile_number, b.movie_id, b.theatre_id, b.seats, b.payment_method, b.total_price FROM bookings b JOIN users u ON u.id = b.user_id WHERE b.id = ?').get(booking.body.confirmationId)).toEqual({ mobile_number: '9123456789', movie_id: movie.id, theatre_id: theatre.id, seats: '["B1","B2"]', payment_method: 'upi', total_price: 300 });
  });

  it('rejects booking after its upstream movie-theatre mapping is removed and leaves no orphan booking', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9234567890' });
    const verification = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9234567890', otp: '1234' });
    const token = verification.body.token as string;
    const movies = await request(app).get('/api/v1/movies').set('Authorization', `Bearer ${token}`);
    const movie = movies.body.movies[0] as { id: number };
    const theatres = await request(app).get(`/api/v1/theatres?movieId=${movie.id}`).set('Authorization', `Bearer ${token}`);
    const theatre = theatres.body.theatres[0] as { id: number };

    database.prepare('DELETE FROM movie_theatres WHERE movie_id = ? AND theatre_id = ?').run(movie.id, theatre.id);
    const booking = await request(app).post('/api/v1/bookings').set('Authorization', `Bearer ${token}`).send({
      movieId: movie.id,
      theatreId: theatre.id,
      seats: ['C1'],
      paymentMethod: 'card',
      totalPrice: 150
    });

    expect(verification.status).toBe(200);
    expect(movies.status).toBe(200);
    expect(theatres.status).toBe(200);
    expect(booking.status).toBe(400);
    expect(booking.body).toEqual({ error: 'Theatre is not available for this movie' });
    expect(database.prepare('SELECT COUNT(*) AS count FROM bookings').get()).toEqual({ count: 0 });
  });
});