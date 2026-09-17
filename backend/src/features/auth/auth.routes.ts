import { Router } from 'express';
import type Database from 'better-sqlite3';
import { createAuthController } from './auth.controller';
import { AuthService } from './auth.service';

/** Build the versioned router for passwordless authentication endpoints. */
export function createAuthRouter(database: Database.Database, jwtSecret: string): Router {
  const router = Router();
  const controller = createAuthController(new AuthService(database, jwtSecret));
  router.post('/login', controller.login);
  router.post('/verify', controller.verify);
  return router;
}
