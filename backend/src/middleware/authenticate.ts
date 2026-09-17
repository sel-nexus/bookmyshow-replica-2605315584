import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './error-handler';

/** Verify bearer credentials before allowing access to protected resources. */
export function authenticate(jwtSecret: string): RequestHandler {
  /** Reject missing, malformed, and unverifiable bearer tokens. */
  return (req, res, next): void => {
    const authorization = req.header('authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/);
    if (!match) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    try {
      const verifiedToken = jwt.verify(match[1], jwtSecret, { issuer: 'bookmyshow-replica' });
      const userId = typeof verifiedToken === 'string' ? NaN : Number(verifiedToken.sub);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new HttpError(401, 'Invalid authentication token');
      }
      res.locals.userId = userId;
      next();
    } catch (_error: unknown) {
      next(new HttpError(401, 'Invalid authentication token'));
    }
  };
}
