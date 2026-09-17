import dotenv from 'dotenv';
import { z } from 'zod';

/** Load local development environment variables before configuration validation. */
dotenv.config();

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  DATABASE_PATH: z.string().min(1).default('./data/bookmyshow.db'),
  TEST_DATABASE_PATH: z.string().min(1).default('./data/bookmyshow.test.db'),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-in-production')
});

/** Expose validated runtime configuration for the API. */
export const config = (() => {
  const values = environmentSchema.parse(process.env);
  return {
    port: values.PORT,
    corsOrigins: values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    databasePath: values.DATABASE_PATH,
    testDatabasePath: values.TEST_DATABASE_PATH,
    jwtSecret: values.JWT_SECRET
  };
})();
