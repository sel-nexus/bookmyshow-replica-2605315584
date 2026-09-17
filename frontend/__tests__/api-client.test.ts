import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestOtp } from '../lib/api-client';

describe('requestOtp', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the same-origin API path when the public base URL is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'OTP sent' }) });
    vi.stubGlobal('fetch', fetchMock);

    await requestOtp('9876543210');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({ method: 'POST' }));
  });
});
