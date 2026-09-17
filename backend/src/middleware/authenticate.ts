import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './error-handler';

/** Verify bearer credentials before allowing access to protected resources. */
export function authenticate(jwtSecret: string): RequestHandler {
  /** Reject missing, malformed, and unverifiable bearer tokens. */
  return (req, _res, next): void => {
    const authorization = req.header('authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    if (!match) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    try {
      jwt.verify(match[1], jwtSecret, { issuer: 'bookmyshow-replica' });
      next();
    } catch (_error: unknown) {
      next(new HttpError(401, 'Invalid authentication token'));
    }
  };
}
