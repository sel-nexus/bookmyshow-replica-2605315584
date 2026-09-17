import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createDatabase } from '../src/db/database';
import type Database from 'better-sqlite3';

/** Exercise the auth HTTP contract against an actual temporary SQLite file. */
describe('auth API', () => {
  const jwtSecret = 'test-secret-that-is-long-enough';
  let database: Database.Database;
  let databasePath: string;

  beforeEach(() => {
    databasePath = path.join(os.tmpdir(), `bookmyshow-auth-${Date.now()}-${Math.random()}.db`);
    database = createDatabase(databasePath);
  });

  afterEach(() => {
    database.close();
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
  });

  it('returns health and starts a valid mobile login request', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const health = await request(app).get('/api/health');
    const login = await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });

    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok' });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ message: 'OTP sent', mobileNumber: '9876543210' });
    expect(database.prepare('SELECT COUNT(*) AS count FROM users WHERE mobile_number = ?').get('9876543210'))
      .toMatchObject({ count: 1 });
  });

  it.each([
    ['login', {}, 'missing mobile number'],
    ['login', { mobileNumber: 9876543210 }, 'numeric mobile number'],
    ['login', { mobileNumber: '123' }, 'short mobile number'],
    ['login', { mobileNumber: "9876543210' OR 1=1 --" }, 'hostile mobile string'],
    ['verify', {}, 'missing mobile number and OTP'],
    ['verify', { mobileNumber: '9876543210' }, 'missing OTP'],
    ['verify', { mobileNumber: '9876543210', otp: 1234 }, 'numeric OTP'],
    ['verify', { mobileNumber: "9876543210' OR 1=1 --", otp: '1234' }, 'hostile mobile string']
  ])('returns a stable 400 body for invalid %s payload: %s', async (endpoint, body) => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const response = await request(app).post(`/api/v1/auth/${endpoint}`).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request');
    expect(response.body.details).toEqual(expect.any(Object));
    expect(database.prepare('SELECT COUNT(*) AS count FROM users').get()).toEqual({ count: 0 });
  });

  it('returns a JWT for the correct OTP and explicit 401 bodies for missing login and incorrect OTP', async () => {
    const app = createApp(database, jwtSecret, ['http://localhost:3000']);
    const noLogin = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });
    const success = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    const failure = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '0000' });

    expect(noLogin.status).toBe(401);
    expect(noLogin.body).toEqual({ error: 'Login request not found' });
    expect(success.status).toBe(200);
    expect(success.body).toMatchObject({ tokenType: 'Bearer' });
    expect(success.body.token).toEqual(expect.any(String));
    expect(failure.status).toBe(401);
    expect(failure.body).toEqual({ error: 'Invalid OTP' });
  });
});