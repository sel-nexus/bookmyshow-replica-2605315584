import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../../middleware/error-handler';
import { CatalogService } from './catalog.service';

const theatreQuerySchema = z.object({
  movieId: z.string().regex(/^[1-9]\d*$/, 'movieId must be a positive integer').transform(Number)
});

interface CatalogTestOptions {
  delayMs: number;
  emptyTheatresMovieId?: number;
}

/** Create Express handlers for the protected catalogue endpoints. */
export function createCatalogController(catalogService: CatalogService, testOptions: CatalogTestOptions) {
  const delayResponse = async (): Promise<void> => {
    if (testOptions.delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, testOptions.delayMs));
    }
  };
  /** Return the full seeded movie catalogue. */
  const listMovies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ movies: catalogService.listMovies() });
    } catch (error: unknown) {
      next(error);
    }
  };

  /** Return persisted theatre options for a valid existing movie. */
  const listTheatres = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { movieId } = theatreQuerySchema.parse(req.query);
      if (!catalogService.movieExists(movieId)) {
        throw new HttpError(404, 'Movie not found');
      }
      await delayResponse();
      const theatres = movieId === testOptions.emptyTheatresMovieId
        ? []
        : catalogService.listTheatresForMovie(movieId);
      res.status(200).json({ theatres });
    } catch (error: unknown) {
      next(error);
    }
  };

  return { listMovies, listTheatres };
}
