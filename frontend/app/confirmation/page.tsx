'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationTicket } from '../../components/booking/ConfirmationTicket';
import { readBookingConfirmation } from '../../lib/booking-session';
import type { BookingConfirmation } from '../../lib/booking-api';

/** Render a protected ticket confirmation using only backend-persisted response data. */
export default function ConfirmationPage() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem('bookmyshow_token')) {
      router.replace('/login');
      return;
    }
    const storedConfirmation = readBookingConfirmation(window.sessionStorage);
    if (!storedConfirmation) {
      router.replace('/movies');
      return;
    }
    setConfirmation(storedConfirmation);
  }, [router]);

  if (!confirmation) {
    return <main className="confirmation-page" aria-live="polite"><p className="catalog-status" role="status">Loading your ticket…</p></main>;
  }

  return <main className="confirmation-page"><ConfirmationTicket confirmation={confirmation} /></main>;
}
