import { z } from 'zod';

/** Validate the non-sensitive command accepted when a customer confirms a booking. */
export const createBookingSchema = z.object({
  movieId: z.number().int().positive(),
  theatreId: z.number().int().positive(),
  seats: z.array(z.string().regex(/^[A-E][1-6]$/, 'Seat must be between A1 and E6')).min(1).superRefine((seats, context) => {
    if (new Set(seats).size !== seats.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Seats must be unique' });
    }
  }),
  paymentMethod: z.enum(['card', 'upi']),
  totalPrice: z.number().int().nonnegative()
}).strict();

/** Describe a validated, non-sensitive booking command. */
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Describe the persisted booking confirmation returned to the customer. */
export interface BookingConfirmation {
  confirmationId: number;
  movie: { id: number; title: string };
  theatre: { id: number; name: string };
  seats: string[];
  paymentMethod: 'card' | 'upi';
  totalPrice: number;
}
