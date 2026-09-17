import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

const mobileNumberSchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must contain exactly 10 digits')
});

const verifySchema = mobileNumberSchema.extend({
  otp: z.string().regex(/^\d{4}$/, 'OTP must contain exactly 4 digits')
});

/** Create Express handlers for the passwordless auth workflow. */
export function createAuthController(authService: AuthService) {
  /** Validate a mobile number and register an OTP login request. */
  const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mobileNumber } = mobileNumberSchema.parse(req.body);
      authService.requestLogin(mobileNumber);
      res.status(200).json({ message: 'OTP sent', mobileNumber });
    } catch (error: unknown) {
      next(error);
    }
  };

  /** Validate OTP credentials and issue the bearer token on success. */
  const verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mobileNumber, otp } = verifySchema.parse(req.body);
      res.status(200).json(authService.verifyOtp(mobileNumber, otp));
    } catch (error: unknown) {
      next(error);
    }
  };

  return { login, verify };
}
