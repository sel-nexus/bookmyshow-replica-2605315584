import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

/** Represent an error whose HTTP status is safe to return to the client. */
export class HttpError extends Error {
  /** Create a structured application error. */
  public constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Return a JSON response for paths that have not been registered. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

/** Convert trusted application and validation failures into stable JSON responses. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', details: error.flatten() });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
};
