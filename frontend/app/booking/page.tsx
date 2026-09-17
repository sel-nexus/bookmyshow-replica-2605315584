'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentForm } from '../../components/booking/PaymentForm';
import { ProcessingPayment } from '../../components/booking/ProcessingPayment';
import { SeatGrid } from '../../components/booking/SeatGrid';
import { readBookingSelection, saveBookingSession, type PaymentDetails } from '../../lib/booking-session';
import type { Movie, Theatre } from '../../lib/catalog-api';

const SEAT_PRICE = 150;

/** Render the protected local seat selection and dummy payment workflow. */
export default function BookingPage() {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theatre, setTheatre] = useState<Theatre | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem('bookmyshow_token');
    if (!token) {
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

  /** Save validated payment detail to activate the static processing state. */
  const handlePay = useCallback((nextPayment: PaymentDetails): void => {
    setPayment(nextPayment);
  }, []);

  /** Persist the local payment session before the future confirmation/API handoff. */
  const handleProcessingComplete = useCallback((): void => {
    if (!movie || !theatre || !payment || selectedSeats.length === 0) {
      router.replace('/movies');
      return;
    }

    saveBookingSession(window.sessionStorage, {
      movie,
      theatre,
      seats: selectedSeats,
      total: selectedSeats.length * SEAT_PRICE,
      payment
    });
    router.push('/confirmation');
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
      <header className="site-header">
        <p className="brand">book<span>my</span>show</p>
        <p className="header-link">Secure checkout</p>
      </header>
      <section className="booking-hero" aria-labelledby="booking-title">
        <p className="eyebrow">YOUR SHOW</p>
        <h1 id="booking-title">{movie.title}</h1>
        <p>{theatre.name}</p>
      </section>
      <div className="booking-layout">
        <SeatGrid selectedSeats={selectedSeats} onSelectSeats={setSelectedSeats} />
        <aside className="booking-summary" aria-labelledby="summary-heading">
          <p className="eyebrow">ORDER SUMMARY</p>
          <h2 id="summary-heading">Your booking</h2>
          <dl>
            <div><dt>Seats</dt><dd>{selectedSeats.length ? selectedSeats.join(', ') : 'Not selected'}</dd></div>
            <div><dt>Price</dt><dd>Rs. {total}</dd></div>
          </dl>
          <p className="summary-total"><span>Total</span><strong>Rs. {total}</strong></p>
        </aside>
        <PaymentForm canPay={selectedSeats.length > 0} onPay={handlePay} />
      </div>
    </main>
  );
}
