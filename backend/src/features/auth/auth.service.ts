import jwt from 'jsonwebtoken';
import type Database from 'better-sqlite3';
import type { AuthTokenResponse, UserRecord } from './auth.types';
import { HttpError } from '../../middleware/error-handler';

/** Own passwordless authentication persistence and token issuance. */
export class AuthService {
  /** Create the auth service around the shared database and JWT signing secret. */
  public constructor(
    private readonly database: Database.Database,
    private readonly jwtSecret: string
  ) {}

  /** Ensure a mobile number has a user record before OTP entry. */
  public requestLogin(mobileNumber: string): void {
    this.database.prepare('INSERT OR IGNORE INTO users (mobile_number) VALUES (?)').run(mobileNumber);
  }

  /** Verify the demo OTP and return a signed bearer token for the existing user. */
  public verifyOtp(mobileNumber: string, otp: string): AuthTokenResponse {
    if (otp !== '1234') {
      throw new HttpError(401, 'Invalid OTP');
    }

    const user = this.database.prepare(
      'SELECT id, mobile_number AS mobileNumber FROM users WHERE mobile_number = ?'
    ).get(mobileNumber) as UserRecord | undefined;

    if (!user) {
      throw new HttpError(401, 'Login request not found');
    }

    const token = jwt.sign({ sub: String(user.id), mobileNumber: user.mobileNumber }, this.jwtSecret, {
      expiresIn: '1h',
      issuer: 'bookmyshow-replica'
    });
    return { token, tokenType: 'Bearer' };
  }
}
