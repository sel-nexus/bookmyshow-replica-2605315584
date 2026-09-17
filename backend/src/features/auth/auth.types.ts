/** Describe the payload accepted to begin a passwordless login. */
export interface LoginInput {
  mobileNumber: string;
}

/** Describe the payload accepted to verify a passwordless login. */
export interface VerifyInput extends LoginInput {
  otp: string;
}

/** Describe the API response returned after a successful OTP verification. */
export interface AuthTokenResponse {
  token: string;
  tokenType: 'Bearer';
}

/** Describe a persisted user record used by the auth service. */
export interface UserRecord {
  id: number;
  mobileNumber: string;
}
