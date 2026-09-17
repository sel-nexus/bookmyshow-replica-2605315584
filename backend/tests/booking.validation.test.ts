import { describe, expect, it } from 'vitest';
import { z } from 'zod';

/** Define the booking request contract that the next booking endpoint will reuse. */
export const bookingPayloadSchema = z.object({
  movieId: z.number().int().positive(),
  theatreId: z.number().int().positive(),
  seats: z.array(z.string().regex(/^[A-E][1-6]$/)).min(1),
  total: z.number().positive(),
  payment: z.discriminatedUnion('method', [
    z.object({ method: z.literal('card'), cardLastFour: z.string().regex(/^\d{4}$/) }),
    z.object({ method: z.literal('upi'), upiId: z.string().min(3).regex(/^\S+@\S+$/) })
  ])
});

/** Validate the future booking request payload contract without exposing an endpoint yet. */
describe('booking payload validation contract', () => {
  it('accepts selected seats and masked card payment data', () => {
    expect(bookingPayloadSchema.safeParse({
      movieId: 1,
      theatreId: 2,
      seats: ['A1', 'A2', 'A3'],
      total: 450,
      payment: { method: 'card', cardLastFour: '4242' }
    }).success).toBe(true);
  });

  it('rejects invalid seats and incomplete payment details', () => {
    expect(bookingPayloadSchema.safeParse({
      movieId: 1,
      theatreId: 2,
      seats: ['Z9'],
      total: 450,
      payment: { method: 'upi', upiId: 'not-a-upi-id' }
    }).success).toBe(false);
  });
});
