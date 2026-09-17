import dotenv from 'dotenv';
import { z } from 'zod';

/** Load local development environment variables before configuration validation. */
dotenv.config();

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  DATABASE_PATH: z.string().min(1).default('./data/bookmyshow.db'),
  TEST_DATABASE_PATH: z.string().min(1).default('./data/bookmyshow.test.db'),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-in-production'),
  TEST_CATALOG_DELAY_MS: z.coerce.number().int().nonnegative().default(0),
  TEST_EMPTY_THEATRES_MOVIE_ID: z.coerce.number().int().nonnegative().default(0)
});

/** Expose validated runtime configuration for the API. */
export const config = (() => {
  const values = environmentSchema.parse({
    PORT: process.env.PORT,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    DATABASE_PATH: process.env.DATABASE_PATH,
    TEST_DATABASE_PATH: process.env.TEST_DATABASE_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    TEST_CATALOG_DELAY_MS: process.env.TEST_CATALOG_DELAY_MS,
    TEST_EMPTY_THEATRES_MOVIE_ID: process.env.TEST_EMPTY_THEATRES_MOVIE_ID
  });
  return {
    port: values.PORT,
    corsOrigins: values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    databasePath: values.DATABASE_PATH,
    testDatabasePath: values.TEST_DATABASE_PATH,
    jwtSecret: values.JWT_SECRET,
    testCatalogDelayMs: values.TEST_CATALOG_DELAY_MS,
    testEmptyTheatresMovieId: values.TEST_EMPTY_THEATRES_MOVIE_ID || undefined
  };
})();
