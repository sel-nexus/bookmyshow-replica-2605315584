import React, { useCallback, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PaymentForm } from '../components/booking/PaymentForm';
import { ProcessingPayment } from '../components/booking/ProcessingPayment';
import { SeatGrid } from '../components/booking/SeatGrid';
import type { PaymentDetails } from '../lib/booking-session';

/** Render the visible booking handoff used to verify payment form interactions. */
function CheckoutHarness({ onComplete = vi.fn() }: { onComplete?: () => void }) {
  const [seats, setSeats] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const handlePay = useCallback((_payment: PaymentDetails): void => setProcessing(true), []);
  const handleComplete = useCallback((): void => onComplete(), [onComplete]);

  return (
    <>
      {processing ? (
        <ProcessingPayment onComplete={handleComplete} />
      ) : (
        <>
          <SeatGrid selectedSeats={seats} onSelectSeats={setSeats} />
          <p>Total: Rs. {seats.length * 150}</p>
          <PaymentForm onPay={handlePay} />
        </>
      )}
    </>
  );
}

/** Test the deterministic checkout UI and its method-specific validation states. */
describe('PaymentForm booking flow', () => {
  it('automatically selects A1, A2, A3 and displays Rs. 450', async () => {
    const user = userEvent.setup();
    render(<CheckoutHarness />);

    await user.click(screen.getByRole('button', { name: 'Select seats' }));

    expect(screen.getByRole('gridcell', { name: 'A1' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('gridcell', { name: 'A2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('gridcell', { name: 'A3' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Total: Rs. 450')).toBeInTheDocument();
  });

  it('shows only card fields or the UPI ID field for the chosen method', async () => {
    const user = userEvent.setup();
    render(<PaymentForm onPay={vi.fn()} />);

    expect(screen.getByLabelText('Card Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Expiry Date')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV')).toBeInTheDocument();
    expect(screen.queryByLabelText('UPI ID')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'UPI' }));
    expect(screen.getByRole('radio', { name: 'UPI' })).toBeChecked();
    expect(screen.getByLabelText('UPI ID')).toBeInTheDocument();
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();
  });

  it('disables payment method controls and submission when payment is unavailable', () => {
    render(<PaymentForm disabled onPay={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Card' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'UPI' })).toBeDisabled();
    expect(screen.getByLabelText('Card Number')).toBeDisabled();
    expect(screen.getByLabelText('Expiry Date')).toBeDisabled();
    expect(screen.getByLabelText('CVV')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pay Rs. 450' })).toBeDisabled();
  });

  it('keeps processing visible through 1999ms and completes only after 2000ms', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<CheckoutHarness onComplete={onComplete} />);

    fireEvent.change(screen.getByLabelText('Card Number'), {
      target: { value: '4242424242424242' },
    });
    fireEvent.change(screen.getByLabelText('Expiry Date'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));
    expect(screen.getByRole('status', { name: 'Payment processing' })).toHaveTextContent(
      'Processing Payment...',
    );
    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: 'Payment processing' })).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
