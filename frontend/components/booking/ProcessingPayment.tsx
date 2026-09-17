'use client';

import React, { useEffect } from 'react';

interface ProcessingPaymentProps {
  onComplete: () => void;
}

/** Announce the fixed-length dummy payment processing state before handoff. */
export function ProcessingPayment({ onComplete }: ProcessingPaymentProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onComplete, 2000);
    return () => window.clearTimeout(timeout);
  }, [onComplete]);

  return <section className="processing-payment" role="status" aria-live="polite" aria-label="Payment processing">Processing Payment...</section>;
}
