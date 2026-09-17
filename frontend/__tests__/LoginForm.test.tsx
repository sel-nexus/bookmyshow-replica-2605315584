import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../components/auth/LoginForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

/** Test the visible behavior of the two-step passwordless login form. */
describe('LoginForm', () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows an accessible error for an invalid mobile number', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('Mobile number'), '123');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid 10-digit mobile number.');
  });

  it('moves from mobile entry to the OTP screen after the login request succeeds', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: 'OTP sent' }), { status: 200 }));
    render(<LoginForm />);
    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('One-time password')).toBeInTheDocument();
    expect(screen.getByText(/We sent a 4-digit code to 9876543210/)).toBeInTheDocument();
  });

  it('shows the API error when the submitted OTP is incorrect', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'OTP sent' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 401 }));
    render(<LoginForm />);
    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(await screen.findByLabelText('One-time password'), '0000');
    await user.click(screen.getByRole('button', { name: 'Verify & continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid OTP');
    expect(push).not.toHaveBeenCalled();
  });
});
