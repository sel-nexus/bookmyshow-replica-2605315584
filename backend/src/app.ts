import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import type Database from 'better-sqlite3';
import { createAuthRouter } from './features/auth/auth.routes';
import { createCatalogRouter } from './features/catalog/catalog.routes';
import { createBookingRouter } from './features/bookings/booking.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

/** Assemble the Express API without binding a network port. */
export function createApp(database: Database.Database, jwtSecret: string, corsOrigins: string[]): Application {
  const app = express();
  app.use(cors({ origin: corsOrigins, credentials: false }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });
  app.use('/api/v1/auth', createAuthRouter(database, jwtSecret));
  app.use('/api/v1', createCatalogRouter(database, jwtSecret));
  app.use('/api/v1', createBookingRouter(database, jwtSecret));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
