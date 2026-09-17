/** Describe the authentication failure returned by the API client. */
export class ApiError extends Error {
  /** Create an API error carrying the HTTP status. */
  public constructor(message: string, public readonly status: number) {
    super(message);
  }
}

/** Send a mobile login request to the versioned authentication API. */
export async function requestOtp(mobileNumber: string): Promise<void> {
  await post('/api/v1/auth/login', { mobileNumber });
}

/** Verify a one-time password and return the API-issued bearer token. */
export async function verifyOtp(mobileNumber: string, otp: string): Promise<string> {
  const payload = await post<{ token: string }>('/api/v1/auth/verify', { mobileNumber, otp });
  return payload.token;
}

/** Send a JSON request and normalize API error payloads. */
async function post<TResponse = Record<string, never>>(path: string, body: object): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as TResponse & { error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error ?? 'Something went wrong. Please try again.', response.status);
  }
  return payload;
}
