import type Database from 'better-sqlite3';
import { HttpError } from '../../middleware/error-handler';
import type { BookingConfirmation, CreateBookingInput } from './booking.types';

const SEAT_PRICE = 150;

interface JoinedBookingRow {
  id: number;
  movieId: number;
  movieTitle: string;
  theatreId: number;
  theatreName: string;
  seats: string;
  paymentMethod: 'card' | 'upi';
  totalPrice: number;
}

/** Persist bookings and derive confirmation data from the SQLite catalogue. */
export class BookingService {
  /** Create the service around the shared file-backed database. */
  public constructor(private readonly database: Database.Database) {}

  /** Validate referenced records, write a booking, and return its joined confirmation data. */
  public createBooking(userId: number, input: CreateBookingInput): BookingConfirmation {
    if (input.totalPrice !== SEAT_PRICE * input.seats.length) {
      throw new HttpError(400, 'totalPrice must equal 150 multiplied by the number of seats');
    }

    if (!this.database.prepare('SELECT 1 FROM movies WHERE id = ?').get(input.movieId)) {
      throw new HttpError(404, 'Movie not found');
    }
    if (!this.database.prepare('SELECT 1 FROM theatres WHERE id = ?').get(input.theatreId)) {
      throw new HttpError(404, 'Theatre not found');
    }
    if (!this.database.prepare('SELECT 1 FROM movie_theatres WHERE movie_id = ? AND theatre_id = ?').get(input.movieId, input.theatreId)) {
      throw new HttpError(400, 'Theatre is not available for this movie');
    }

    const inserted = this.database.prepare(
      'INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, input.movieId, input.theatreId, JSON.stringify(input.seats), input.paymentMethod, input.totalPrice);

    const booking = this.database.prepare(`
      SELECT b.id, m.id AS movieId, m.title AS movieTitle, t.id AS theatreId, t.name AS theatreName,
             b.seats, b.payment_method AS paymentMethod, b.total_price AS totalPrice
      FROM bookings b
      JOIN movies m ON m.id = b.movie_id
      JOIN theatres t ON t.id = b.theatre_id
      WHERE b.id = ? AND b.user_id = ?
    `).get(inserted.lastInsertRowid, userId) as JoinedBookingRow | undefined;

    if (!booking) {
      throw new HttpError(500, 'Booking confirmation could not be loaded');
    }

    return {
      confirmationId: booking.id,
      movie: { id: booking.movieId, title: booking.movieTitle },
      theatre: { id: booking.theatreId, name: booking.theatreName },
      seats: JSON.parse(booking.seats) as string[],
      paymentMethod: booking.paymentMethod,
      totalPrice: booking.totalPrice
    };
  }
}
