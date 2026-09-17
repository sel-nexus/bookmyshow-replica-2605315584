import React from 'react';
import type { BookingConfirmation } from '../../lib/booking-api';

interface ConfirmationTicketProps {
  confirmation: BookingConfirmation;
}

/** Present a backend-returned booking confirmation as an accessible ticket. */
export function ConfirmationTicket({ confirmation }: ConfirmationTicketProps) {
  return (
    <article className="confirmation-ticket" aria-labelledby="ticket-title">
      <p className="eyebrow">BOOKING CONFIRMED</p>
      <h1 id="ticket-title">Congratulations!</h1>
      <p className="confirmation-copy">Your cinema ticket is confirmed and ready for the show.</p>
      <dl className="confirmation-details">
        <div><dt>Movie</dt><dd>{confirmation.movie.title}</dd></div>
        <div><dt>Theatre</dt><dd>{confirmation.theatre.name}</dd></div>
        <div><dt>Seats</dt><dd>{confirmation.seats.join(', ')}</dd></div>
        <div><dt>Payment</dt><dd>{confirmation.paymentMethod === 'upi' ? 'UPI' : 'Card'}</dd></div>
        <div><dt>Total paid</dt><dd>Rs. {confirmation.totalPrice}</dd></div>
        <div><dt>Confirmation ID</dt><dd>#{confirmation.confirmationId}</dd></div>
      </dl>
    </article>
  );
}
