'use client';

import React, { useState } from 'react';
import type { PaymentDetails, PaymentMethod } from '../../lib/booking-session';

interface PaymentFormProps {
  disabled?: boolean;
  canPay?: boolean;
  onPay: (payment: PaymentDetails) => void;
}

type FormErrors = Partial<Record<'cardNumber' | 'expiryDate' | 'cvv' | 'upiId', string>>;

/** Render and validate the dummy card or UPI payment form. */
export function PaymentForm({ disabled = false, canPay = true, onPay }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  /** Switch methods and clear errors that belong to the inactive method. */
  const handleMethodChange = (nextMethod: PaymentMethod): void => {
    setMethod(nextMethod);
    setErrors({});
  };

  /** Validate active fields and pass only the minimal payment detail to checkout. */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validatePayment(method, cardNumber, expiryDate, cvv, upiId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onPay({ method });
  };

  return (
    <section className="payment-panel" aria-labelledby="payment-heading">
      <div className="section-heading">
        <p className="eyebrow">STEP 02</p>
        <h2 id="payment-heading">Payment method</h2>
      </div>
      <form noValidate onSubmit={handleSubmit}>
        <fieldset className="payment-methods" disabled={disabled}>
          <legend>Choose a payment method</legend>
          <label
            className={
              method === 'card' ? 'method-option method-option-active' : 'method-option'
            }
          >
            <input
              type="radio"
              name="payment-method"
              value="card"
              checked={method === 'card'}
              onChange={() => handleMethodChange('card')}
            />
            Card
          </label>
          <label
            className={
              method === 'upi' ? 'method-option method-option-active' : 'method-option'
            }
          >
            <input
              type="radio"
              name="payment-method"
              value="upi"
              checked={method === 'upi'}
              onChange={() => handleMethodChange('upi')}
            />
            UPI
          </label>
        </fieldset>
        {method === 'card' ? (
          <div className="payment-fields">
            <PaymentField id="card-number" label="Card Number" error={errors.cardNumber}>
              <input
                id="card-number"
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.cardNumber)}
                aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
                disabled={disabled}
              />
            </PaymentField>
            <div className="payment-field-row">
              <PaymentField id="expiry-date" label="Expiry Date" error={errors.expiryDate}>
                <input
                  id="expiry-date"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.expiryDate)}
                  aria-describedby={errors.expiryDate ? 'expiry-date-error' : undefined}
                  disabled={disabled}
                />
              </PaymentField>
              <PaymentField id="cvv" label="CVV" error={errors.cvv}>
                <input
                  id="cvv"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cvv}
                  onChange={(event) => setCvv(event.target.value)}
                  aria-required="true"
                  aria-invalid={Boolean(errors.cvv)}
                  aria-describedby={errors.cvv ? 'cvv-error' : undefined}
                  disabled={disabled}
                />
              </PaymentField>
            </div>
          </div>
        ) : (
          <div className="payment-fields">
            <PaymentField id="upi-id" label="UPI ID" error={errors.upiId}>
              <input
                id="upi-id"
                autoComplete="off"
                placeholder="name@bank"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.upiId)}
                aria-describedby={errors.upiId ? 'upi-id-error' : undefined}
                disabled={disabled}
              />
            </PaymentField>
          </div>
        )}
        <button className="primary-button" type="submit" disabled={disabled || !canPay}>
          Pay Rs. 450
        </button>
      </form>
    </section>
  );
}

/** Render a labelled payment field with a linked inline validation message. */
function PaymentField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Validate the fields that belong to the chosen payment method. */
function validatePayment(
  method: PaymentMethod,
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  upiId: string,
): FormErrors {
  if (method === 'upi') {
    return /^\S+@\S+$/.test(upiId.trim()) ? {} : { upiId: 'Enter a valid UPI ID.' };
  }

  const errors: FormErrors = {};
  if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
    errors.cardNumber = 'Enter a valid 16-digit card number.';
  }
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    errors.expiryDate = 'Enter expiry as MM/YY.';
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = 'Enter a valid CVV.';
  }
  return errors;
}
