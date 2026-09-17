import type { Movie, Theatre } from './catalog-api';
import type { BookingConfirmation } from './booking-api';

export const BOOKING_CONFIRMATION_KEY = 'bookmyshow_booking_confirmation';

export type PaymentMethod = 'card' | 'upi';

/** Describe the short-lived payment choice used to construct a non-sensitive API command. */
export interface PaymentDetails {
  method: PaymentMethod;
}

/** Read and validate the catalogue selection stored by the movie workflow. */
export function readBookingSelection(storage: Storage): { movie: Movie; theatre: Theatre } | null {
  const movie = readJson<Movie>(storage.getItem('bookmyshow_selected_movie'));
  const theatre = readJson<Theatre>(storage.getItem('bookmyshow_selected_theatre'));
  return isMovie(movie) && isTheatre(theatre) ? { movie, theatre } : null;
}

/** Persist only the backend confirmation needed to render the next route. */
export function saveBookingConfirmation(storage: Storage, confirmation: BookingConfirmation): void {
  storage.setItem(BOOKING_CONFIRMATION_KEY, JSON.stringify(confirmation));
}

/** Read the backend confirmation without trusting malformed browser storage. */
export function readBookingConfirmation(storage: Storage): BookingConfirmation | null {
  const confirmation = readJson<BookingConfirmation>(storage.getItem(BOOKING_CONFIRMATION_KEY));
  if (!confirmation || !isMovieConfirmation(confirmation.movie) || !isTheatre(confirmation.theatre)
    || !Array.isArray(confirmation.seats) || !confirmation.seats.every((seat) => /^[A-E][1-6]$/.test(seat))
    || !['card', 'upi'].includes(confirmation.paymentMethod) || !Number.isInteger(confirmation.totalPrice)
    || !Number.isInteger(confirmation.confirmationId)) {
    return null;
  }
  return confirmation;
}

/** Parse a stored JSON value without letting malformed browser storage break the booking flow. */
function readJson<TValue>(value: string | null): TValue | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as TValue;
  } catch {
    return null;
  }
}

/** Confirm a catalogue movie has the fields needed by the checkout. */
function isMovie(value: Movie | null): value is Movie {
  return Boolean(value && Number.isInteger(value.id) && typeof value.title === 'string' && typeof value.posterLabel === 'string');
}

/** Confirm a backend confirmation movie has the fields needed by the ticket. */
function isMovieConfirmation(value: BookingConfirmation['movie'] | null): value is BookingConfirmation['movie'] {
  return Boolean(value && Number.isInteger(value.id) && typeof value.title === 'string');
}

/** Confirm a catalogue theatre has the fields needed by checkout and confirmation. */
function isTheatre(value: Theatre | BookingConfirmation['theatre'] | null): value is Theatre {
  return Boolean(value && Number.isInteger(value.id) && typeof value.name === 'string');
}
