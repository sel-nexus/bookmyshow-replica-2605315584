import type { Movie, Theatre } from './catalog-api';

export const BOOKING_SESSION_KEY = 'bookmyshow_booking_session';

export type PaymentMethod = 'card' | 'upi';

/** Describe payment details retained only for the client-side confirmation handoff. */
export interface PaymentDetails {
  method: PaymentMethod;
  cardLastFour?: string;
  upiId?: string;
}

/** Describe the local booking handoff consumed by the future booking API client. */
export interface BookingSession {
  movie: Movie;
  theatre: Theatre;
  seats: string[];
  total: number;
  payment: PaymentDetails;
}

/** Read and validate the catalogue selection stored by the movie workflow. */
export function readBookingSelection(storage: Storage): { movie: Movie; theatre: Theatre } | null {
  const movie = readJson<Movie>(storage.getItem('bookmyshow_selected_movie'));
  const theatre = readJson<Theatre>(storage.getItem('bookmyshow_selected_theatre'));

  if (!isMovie(movie) || !isTheatre(theatre)) {
    return null;
  }

  return { movie, theatre };
}

/** Persist a typed payment-ready booking session for confirmation or a future API client. */
export function saveBookingSession(storage: Storage, session: BookingSession): void {
  storage.setItem(BOOKING_SESSION_KEY, JSON.stringify(session));
}

/** Parse a stored JSON value without letting malformed browser storage break the booking flow. */
function readJson<TValue>(value: string | null): TValue | null {
  if (!value) {
    return null;
  }

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

/** Confirm a catalogue theatre has the fields needed by the checkout. */
function isTheatre(value: Theatre | null): value is Theatre {
  return Boolean(value && Number.isInteger(value.id) && typeof value.name === 'string');
}
