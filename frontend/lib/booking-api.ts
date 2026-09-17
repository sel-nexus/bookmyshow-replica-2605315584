import { ApiError } from './api-client';

/** Describe the secure command sent to create a durable booking. */
export interface CreateBookingRequest {
  movieId: number;
  theatreId: number;
  seats: string[];
  paymentMethod: 'card' | 'upi';
  totalPrice: number;
}

/** Describe the backend-owned ticket confirmation displayed after booking. */
export interface BookingConfirmation {
  confirmationId: number;
  movie: { id: number; title: string };
  theatre: { id: number; name: string };
  seats: string[];
  paymentMethod: 'card' | 'upi';
  totalPrice: number;
}

/** Send only non-sensitive booking data using the current bearer token. */
export async function createBooking(token: string, booking: CreateBookingRequest): Promise<BookingConfirmation> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/api/v1/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(booking)
  });
  const payload = await response.json() as BookingConfirmation & { error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error ?? 'Unable to confirm your booking. Please try again.', response.status);
  }
  return payload;
}
