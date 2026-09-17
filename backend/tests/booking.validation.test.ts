import { describe, expect, it } from 'vitest';
import { createBookingSchema } from '../src/features/bookings/booking.types';

/** Verify the booking endpoint accepts only its secure, non-sensitive command shape. */
describe('booking payload validation contract', () => {
  /** Accept mapped-resource identifiers, valid unique seats, payment method, and derived total. */
  it('accepts a non-sensitive booking command', () => {
    expect(createBookingSchema.safeParse({
      movieId: 1,
      theatreId: 2,
      seats: ['A1', 'A2', 'A3'],
      paymentMethod: 'card',
      totalPrice: 450
    }).success).toBe(true);
  });

  /** Reject malformed or duplicate seats and reject card data outside the endpoint contract. */
  it('rejects invalid seats, duplicates, and sensitive payment fields', () => {
    expect(createBookingSchema.safeParse({
      movieId: 1,
      theatreId: 2,
      seats: ['A1', 'A1'],
      paymentMethod: 'upi',
      totalPrice: 300
    }).success).toBe(false);
    expect(createBookingSchema.safeParse({
      movieId: 1,
      theatreId: 2,
      seats: ['A1'],
      paymentMethod: 'card',
      totalPrice: 150,
      cardNumber: '4242424242424242'
    }).success).toBe(false);
  });
});
