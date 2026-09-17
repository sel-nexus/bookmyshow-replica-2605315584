'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentForm } from '../../components/booking/PaymentForm';
import { ProcessingPayment } from '../../components/booking/ProcessingPayment';
import { SeatGrid } from '../../components/booking/SeatGrid';
import { createBooking } from '../../lib/booking-api';
import { readBookingSelection, saveBookingConfirmation, type PaymentDetails } from '../../lib/booking-session';
import type { Movie, Theatre } from '../../lib/catalog-api';

const SEAT_PRICE = 150;

/** Render the protected seat selection, dummy payment, and durable booking workflow. */
export default function BookingPage() {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theatre, setTheatre] = useState<Theatre | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem('bookmyshow_token')) {
      router.replace('/login');
      return;
    }
    const selection = readBookingSelection(window.sessionStorage);
    if (!selection) {
      router.replace('/movies');
      return;
    }
    setMovie(selection.movie);
    setTheatre(selection.theatre);
  }, [router]);

  /** Save the payment method in component memory and begin the fixed processing timer. */
  const handlePay = useCallback((nextPayment: PaymentDetails): void => {
    setBookingError(null);
    setPayment(nextPayment);
  }, []);

  /** Post the non-sensitive booking command after processing, then store the backend ticket. */
  const handleProcessingComplete = useCallback(async (): Promise<void> => {
    const token = window.localStorage.getItem('bookmyshow_token');
    if (!movie || !theatre || !payment || selectedSeats.length === 0 || !token) {
      router.replace('/movies');
      return;
    }
    try {
      const confirmation = await createBooking(token, {
        movieId: movie.id,
        theatreId: theatre.id,
        seats: selectedSeats,
        paymentMethod: payment.method,
        totalPrice: selectedSeats.length * SEAT_PRICE
      });
      saveBookingConfirmation(window.sessionStorage, confirmation);
      router.push('/confirmation');
    } catch (error: unknown) {
      setBookingError(error instanceof Error ? error.message : 'Unable to confirm your booking. Please try again.');
      setPayment(null);
    }
  }, [movie, payment, router, selectedSeats, theatre]);

  if (!movie || !theatre) {
    return <main className="booking-page" aria-live="polite"><p className="catalog-status" role="status">Preparing your booking…</p></main>;
  }
  if (payment) {
    return <main className="booking-page"><ProcessingPayment onComplete={handleProcessingComplete} /></main>;
  }

  const total = selectedSeats.length * SEAT_PRICE;
  return (
    <main className="booking-page">
      <header className="site-header"><p className="brand">book<span>my</span>show</p><p className="header-link">Secure checkout</p></header>
      <section className="booking-hero" aria-labelledby="booking-title"><p className="eyebrow">YOUR SHOW</p><h1 id="booking-title">{movie.title}</h1><p>{theatre.name}</p></section>
      <div className="booking-layout">
        <SeatGrid selectedSeats={selectedSeats} onSelectSeats={setSelectedSeats} />
        <aside className="booking-summary" aria-labelledby="summary-heading">
          <p className="eyebrow">ORDER SUMMARY</p><h2 id="summary-heading">Your booking</h2>
          <dl><div><dt>Seats</dt><dd>{selectedSeats.length ? selectedSeats.join(', ') : 'Not selected'}</dd></div><div><dt>Price</dt><dd>Rs. {total}</dd></div></dl>
          <p className="summary-total"><span>Total</span><strong>Rs. {total}</strong></p>
        </aside>
        <div>{bookingError && <p className="form-error booking-error" role="alert">{bookingError} Select your payment method and try again.</p>}<PaymentForm canPay={selectedSeats.length > 0} onPay={handlePay} /></div>
      </div>
    </main>
  );
}
