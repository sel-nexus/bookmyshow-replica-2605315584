import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaymentForm } from '../components/booking/PaymentForm';
import { SeatGrid } from '../components/booking/SeatGrid';
import type { PaymentDetails } from '../lib/booking-session';

/** Render SeatGrid with visible state so deterministic selection is asserted as a user outcome. */
function SeatGridHarness() {
  const [seats, setSeats] = useState<string[]>([]);

  return (
    <>
      <SeatGrid selectedSeats={seats} onSelectSeats={setSeats} />
      <output>{seats.join(', ')}</output>
    </>
  );
}

/** Surface a completed payment method as an observable checkout outcome. */
function PaymentCompletionHarness() {
  const [payment, setPayment] = useState<PaymentDetails | null>(null);

  return payment ? (
    <output>Payment completed with {payment.method}</output>
  ) : (
    <PaymentForm onPay={setPayment} />
  );
}

/** Cover booking controls' deterministic selection and payment states. */
describe('booking components', () => {
  it('automatically selects A1, A2, and A3 as visible grid and summary state', async () => {
    const user = userEvent.setup();
    render(<SeatGridHarness />);

    await user.click(screen.getByRole('button', { name: 'Select seats' }));

    expect(screen.getByRole('gridcell', { name: 'A1' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('gridcell', { name: 'A2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('gridcell', { name: 'A3' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('A1, A2, A3');
  });

  it.each([
    ['Card Number', '123', 'Enter a valid 16-digit card number.'],
    ['Expiry Date', '2030', 'Enter expiry as MM/YY.'],
    ['CVV', '1', 'Enter a valid CVV.'],
  ])('marks an invalid card %s with its specific validation error', async (label, value, message) => {
    const user = userEvent.setup();
    render(<PaymentForm onPay={vi.fn()} />);

    await user.type(screen.getByLabelText('Card Number'), '4242424242424242');
    await user.type(screen.getByLabelText('Expiry Date'), '12/30');
    await user.type(screen.getByLabelText('CVV'), '123');
    await user.clear(screen.getByLabelText(label));
    await user.type(screen.getByLabelText(label), value);
    await user.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));

    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('renders a UPI validation error without leaving the payment form', async () => {
    const user = userEvent.setup();
    render(<PaymentCompletionHarness />);

    await user.click(screen.getByRole('radio', { name: 'UPI' }));
    await user.type(screen.getByLabelText('UPI ID'), 'not-a-upi-id');
    await user.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid UPI ID.');
    expect(screen.getByRole('button', { name: 'Pay Rs. 450' })).toBeInTheDocument();
  });

  it('completes a valid UPI payment as visible checkout state', async () => {
    const user = userEvent.setup();
    render(<PaymentCompletionHarness />);

    await user.click(screen.getByRole('radio', { name: 'UPI' }));
    await user.type(screen.getByLabelText('UPI ID'), 'viewer@bank');
    await user.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));

    expect(screen.getByText('Payment completed with upi')).toBeInTheDocument();
  });
});
