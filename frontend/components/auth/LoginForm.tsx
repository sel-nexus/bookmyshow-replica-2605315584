'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, requestOtp, verifyOtp } from '../../lib/api-client';

/** Render the two-step mobile number and OTP login workflow. */
export function LoginForm() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Submit the current form step and surface a field-level recovery message on failure. */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (step === 'otp' && !/^\d{4}$/.test(otp)) {
      setError('Enter the 4-digit OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (step === 'mobile') {
        await requestOtp(mobileNumber);
        setStep('otp');
      } else {
        const token = await verifyOtp(mobileNumber, otp);
        window.localStorage.setItem('bookmyshow_token', token);
        router.push('/movies');
      }
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to connect. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-copy">
        <p className="eyebrow">
          {step === 'mobile' ? 'WELCOME BACK' : 'ALMOST THERE'}
        </p>
        <h1>{step === 'mobile' ? 'Sign in to the show.' : 'Check your messages.'}</h1>
        <p>
          {step === 'mobile'
            ? 'Enter your mobile number to receive a one-time password.'
            : `We sent a 4-digit code to ${mobileNumber}.`}
        </p>
      </div>

      {step === 'mobile' ? (
        <div className="field-group">
          <label htmlFor="mobileNumber">Mobile number</label>
          <div className="mobile-input">
            <span aria-hidden="true">+91</span>
            <input
              id="mobileNumber"
              name="mobileNumber"
              inputMode="numeric"
              autoComplete="tel"
              value={mobileNumber}
              onChange={(event) =>
                setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))
              }
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="field-group">
          <label htmlFor="otp">One-time password</label>
          <input
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
            aria-required="true"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
          />
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setStep('mobile');
              setOtp('');
              setError('');
            }}
          >
            Change mobile number
          </button>
        </div>
      )}

      <div aria-live="assertive">
        {error && (
          <p className="form-error" id="login-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : step === 'mobile' ? 'Continue' : 'Verify & continue'}
      </button>
      {step === 'otp' && (
        <p className="hint">
          For this preview, use OTP <strong>1234</strong>.
        </p>
      )}
    </form>
  );
}
