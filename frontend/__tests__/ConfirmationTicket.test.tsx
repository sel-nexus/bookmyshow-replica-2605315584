import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConfirmationTicket } from '../components/booking/ConfirmationTicket';

/** Verify backend-shaped confirmation data is rendered as customer-visible ticket details. */
describe('ConfirmationTicket', () => {
  it('renders the movie, theatre, seats, payment method, and backend confirmation ID', () => {
    render(
      <ConfirmationTicket
        confirmation={{
          confirmationId: 42,
          movie: { id: 1, title: 'Paradise' },
          theatre: { id: 1, name: 'Sandhya 70mm' },
          seats: ['A1', 'A2', 'A3'],
          paymentMethod: 'card',
          totalPrice: 450,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Congratulations!' })).toBeInTheDocument();
    expect(screen.getByText('Paradise')).toBeInTheDocument();
    expect(screen.getByText('Sandhya 70mm')).toBeInTheDocument();
    expect(screen.getByText('A1, A2, A3')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Rs. 450')).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('formats a single-seat UPI confirmation from valid backend data', () => {
    render(
      <ConfirmationTicket
        confirmation={{
          confirmationId: 7,
          movie: { id: 4, title: 'Riverlight' },
          theatre: { id: 2, name: 'Cineplex' },
          seats: ['C8'],
          paymentMethod: 'upi',
          totalPrice: 150,
        }}
      />,
    );

    expect(screen.getByText('C8')).toBeInTheDocument();
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('Rs. 150')).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
  });
});
