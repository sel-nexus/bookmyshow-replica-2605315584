import { Router } from 'express';
import type Database from 'better-sqlite3';
import { authenticate } from '../../middleware/authenticate';
import { createBookingController } from './booking.controller';
import { BookingService } from './booking.service';

/** Build protected routes for durable booking creation. */
export function createBookingRouter(database: Database.Database, jwtSecret: string): Router {
  const router = Router();
  const controller = createBookingController(new BookingService(database));
  router.use(authenticate(jwtSecret));
  router.post('/bookings', controller.createBooking);
  return router;
}
