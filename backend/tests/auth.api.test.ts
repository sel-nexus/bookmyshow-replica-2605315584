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
    const app = createApp(database, 'test-secret-that-is-long-enough', ['http://localhost:3000']);
    const health = await request(app).get('/api/health');
    const login = await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });

    expect(health.status).toBe(200);
    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({ message: 'OTP sent', mobileNumber: '9876543210' });
    expect(database.prepare('SELECT COUNT(*) AS count FROM users WHERE mobile_number = ?').get('9876543210'))
      .toMatchObject({ count: 1 });
  });

  it('rejects malformed mobile input', async () => {
    const app = createApp(database, 'test-secret-that-is-long-enough', ['http://localhost:3000']);
    const response = await request(app).post('/api/v1/auth/login').send({ mobileNumber: '123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request');
  });

  it('returns a JWT for the correct OTP and 401 for an incorrect OTP', async () => {
    const app = createApp(database, 'test-secret-that-is-long-enough', ['http://localhost:3000']);
    await request(app).post('/api/v1/auth/login').send({ mobileNumber: '9876543210' });
    const success = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '1234' });
    const failure = await request(app).post('/api/v1/auth/verify').send({ mobileNumber: '9876543210', otp: '0000' });

    expect(success.status).toBe(200);
    expect(success.body).toMatchObject({ tokenType: 'Bearer' });
    expect(success.body.token).toEqual(expect.any(String));
    expect(failure.status).toBe(401);
    expect(failure.body.error).toBe('Invalid OTP');
  });
});
