import type { NextFunction, Request, Response } from 'express';
import { createBookingSchema } from './booking.types';
import { BookingService } from './booking.service';

/** Create Express handlers for persisted booking confirmation. */
export function createBookingController(bookingService: BookingService) {
  /** Validate a non-sensitive booking request and return the durable confirmation. */
  const createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createBookingSchema.parse(req.body);
      const userId = res.locals.userId as number | undefined;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      res.status(201).json(bookingService.createBooking(userId, input));
    } catch (error: unknown) {
      next(error);
    }
  };

  return { createBooking };
}
